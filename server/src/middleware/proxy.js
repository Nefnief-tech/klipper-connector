import { createProxyMiddleware } from 'http-proxy-middleware'
import prisma from '../config/database.js'

const proxyCache = new Map()

export async function createPrinterProxy(req, res, next) {
  try {
    const name = req.params.name
    if (!name) return next()

    const printer = await prisma.printer.findFirst({
      where: { name, userId: req.userId, status: 'active' }
    })

    if (!printer) {
      return res.status(404).json({ error: `Printer "${name}" not found` })
    }

    const targetUrl = `${printer.hostUrl}:${printer.port}`
    const cacheKey = `${targetUrl}-${printer.path}`
    
    let proxy = proxyCache.get(cacheKey)

    if (!proxy) {
      proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        autoRewrite: true,
        protocolRewrite: 'http',
        pathRewrite: (path, req) => {
          // Identify the request context
          const url = req.originalUrl || req.url
          const printerPrefix = `/printer/${name}`
          const isDirect = url.startsWith(printerPrefix)
          
          let subPath = path
          if (isDirect) {
            // Remove /printer/NAME prefix
            subPath = path.replace(new RegExp(`^${printerPrefix}/?`), '')
          }
          
          // Ensure printer base path
          const base = printer.path === '/' ? '' : printer.path
          
          // Join and normalize
          const result = (base + '/' + subPath.replace(/^\//, '')).replace(/\/+/g, '/')
          return result || '/'
        },
        onProxyReq: (proxyReq, req) => {
          // Critical: Moonraker/Mainsail often fail if these are present
          proxyReq.removeHeader('Cookie')
          proxyReq.removeHeader('Authorization')
          
          // Debug log
          console.log(`[PROXY EXEC] ${req.method} ${req.originalUrl} -> ${targetUrl}${proxyReq.path}`)
        },
        onError: (err, req, res) => {
          console.error(`[PROXY ERROR] ${name}:`, err.message)
          if (!res.headersSent) {
            res.status(502).json({ error: 'Printer communication failure' })
          }
        }
      })
      proxyCache.set(cacheKey, proxy)
    }

    return proxy(req, res, next)
  } catch (error) {
    console.error('Proxy setup error:', error)
    res.status(500).json({ error: 'Internal proxy configuration error' })
  }
}

export function handleProxy(req, res, next) {
  return createPrinterProxy(req, res, next)
}
