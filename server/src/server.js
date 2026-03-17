import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import printerRoutes from './routes/printers.js'
import { createPrinterProxy } from './middleware/proxy.js'
import { verifyToken } from './utils/jwt.js'
import prisma from './config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false
}))
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(cookieParser())

// 1. Health check & Favicon
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))
app.get('/favicon.ico', (req, res) => res.status(204).end())

// 2. API Routes
app.use('/api/auth', express.json(), authRoutes)
app.use('/api/printers', express.json(), printerRoutes)

// 3. Printer Proxy for HTTP requests
app.use(async (req, res, next) => {
  const url = req.originalUrl || req.url

  if (url.startsWith('/api/') || url.startsWith('/src/') || url.startsWith('/@') || url.startsWith('/node_modules/') || url === '/main.jsx') {
    return next()
  }

  let printerName = null

  const directMatch = url.match(/^\/printer\/([^/?#]+)/)
  if (directMatch && !['assets', 'js', 'css', 'img', 'octoapp'].includes(directMatch[1])) {
    printerName = decodeURIComponent(directMatch[1])
  }

  if (!printerName) {
    const referer = req.headers.referer || ''
    const refMatch = referer.match(/\/printer\/([^/?#]+)/) || referer.match(/\/node\/([^/?#]+)/)
    if (refMatch) {
      printerName = decodeURIComponent(refMatch[1])
    }
  }

  if (printerName) {
    let token = req.query.token || req.cookies.token
    if (!token && req.headers.referer && req.headers.referer.includes('token=')) {
      try {
        const refUrl = new URL(req.headers.referer)
        token = refUrl.searchParams.get('token')
      } catch (e) {}
    }

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        if (req.query.token) {
          res.cookie('token', token, { httpOnly: true, path: '/', maxAge: 3600000 })
        }

        req.userId = decoded.userId
        req.params = { name: printerName }
        console.log(`[ROUTE MATCH] ${req.method} ${url} -> Node: ${printerName}`)
        return createPrinterProxy(req, res, next)
      }
    }
    console.log(`[AUTH FAIL] ${url}`)
  }

  next()
})

// 4. Production Static Files
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))
  app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')))
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
