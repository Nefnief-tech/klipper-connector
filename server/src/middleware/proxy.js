import { createProxyMiddleware } from 'http-proxy-middleware'
import prisma from '../config/database.js'

export async function createPrinterProxy(req, res, next) {
  try {
    const { name } = req.params

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const printer = await prisma.printer.findFirst({
      where: {
        name,
        userId: req.userId,
        status: 'active'
      }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found or inactive' })
    }

    const targetUrl = `${printer.hostUrl}:${printer.port}`

    const proxy = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        [`^/printer/${name}`]: printer.path
      },
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying ${req.method} ${req.url} to ${targetUrl}${printer.path}`)
      },
      onProxyRes: (proxyRes, req) => {
        console.log(`Response from printer: ${proxyRes.statusCode}`)
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err)
        res.status(502).json({ error: 'Bad gateway - printer unavailable' })
      }
    })

    proxy(req, res, next)

    await prisma.printer.update({
      where: { id: printer.id },
      data: { lastAccessed: new Date() }
    })
  } catch (error) {
    console.error('Proxy middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export function handleProxy(req, res, next) {
  return createPrinterProxy(req, res, next)
}
