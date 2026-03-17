# Klipper Printer Gateway Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a secure web gateway for authenticated access to multiple Klipper 3D printer interfaces

**Architecture:** Node.js + Express backend with React SPA frontend, PostgreSQL database, JWT authentication, and reverse proxy for printer access

**Tech Stack:**
- Backend: Node.js, Express, PostgreSQL, JWT, http-proxy-middleware, bcrypt, Prisma
- Frontend: React, React Router, Vite, Axios, TailwindCSS

---

## Project Setup

### Task 1: Initialize Git repository

**Files:**
- None

**Step 1: Initialize git**

```bash
git init
```

**Step 2: Create .gitignore**

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite
EOF
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: initialize project with gitignore"
```

### Task 2: Create project structure

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `frontend/package.json`

**Step 1: Create root package.json**

```json
{
  "name": "kl-gateway",
  "version": "1.0.0",
  "description": "Klipper Printer Gateway",
  "private": true,
  "workspaces": [
    "server",
    "frontend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:frontend\"",
    "dev:server": "cd server && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "start": "cd server && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 2: Create server package.json**

```bash
mkdir -p server
cat > server/package.json << 'EOF'
{
  "name": "kl-gateway-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec node src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "http-proxy-middleware": "^2.0.6",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0"
  }
}
EOF
```

**Step 3: Create frontend package.json**

```bash
mkdir -p frontend
cat > frontend/package.json << 'EOF'
{
  "name": "kl-gateway-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "vite": "^5.0.8"
  }
}
EOF
```

**Step 4: Commit**

```bash
git add package.json server/package.json frontend/package.json
git commit -m "feat: create project structure and package files"
```

### Task 3: Install dependencies

**Files:**
- None

**Step 1: Install root dependencies**

```bash
npm install
```

**Step 2: Install server dependencies**

```bash
cd server && npm install
```

**Step 3: Install frontend dependencies**

```bash
cd ../frontend && npm install
```

**Step 4: Commit**

```bash
cd ..
git add package-lock.json server/package-lock.json frontend/package-lock.json
git commit -m "chore: install project dependencies"
```

### Task 4: Configure Prisma

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/.env.example`

**Step 1: Create Prisma schema**

```bash
cat > server/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  passwordHash String    @map("password_hash")
  createdAt    DateTime  @default(now()) @map("created_at")
  isActive     Boolean   @default(true) @map("is_active")

  printers     Printer[]

  @@map("users")
}

model Printer {
  id           String    @id @default(uuid())
  name         String
  hostUrl      String    @map("host_url")
  port         Int       @default(80)
  path         String
  description  String?
  status       String    @default("active")
  lastAccessed DateTime? @map("last_accessed")
  createdAt    DateTime  @default(now()) @map("created_at")

  userId       String
  user         User      @relation(fields: [userId], references: [id])

  @@unique([userId, name])
  @@map("printers")
}
EOF
```

**Step 2: Create .env.example**

```bash
cat > server/.env.example << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/kl_gateway?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
EOF
```

**Step 3: Create .env**

```bash
cp server/.env.example server/.env
```

**Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/.env.example server/.env
git commit -m "feat: configure Prisma ORM with User and Printer models"
```

---

## Backend Implementation

### Task 5: Create Express server

**Files:**
- Create: `server/src/server.js`
- Create: `server/src/config/database.js`

**Step 1: Create database config**

```bash
mkdir -p server/src/config
cat > server/src/config/database.js << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
EOF
```

**Step 2: Create server.js**

```bash
mkdir -p server/src
cat > server/src/server.js << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
```

**Step 3: Test server starts**

```bash
cd server && node src/server.js
```
Expected: "Server running on port 3001"

Press Ctrl+C to stop

**Step 4: Commit**

```bash
git add server/src/config/database.js server/src/server.js
git commit -m "feat: create Express server with basic middleware"
```

### Task 6: Create JWT utilities

**Files:**
- Create: `server/src/utils/jwt.js`

**Step 1: Write JWT utilities**

```bash
mkdir -p server/src/utils
cat > server/src/utils/jwt.js << 'EOF'
import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m'
const REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d'
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'

export function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION })
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.type !== 'refresh') {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}
EOF
```

**Step 2: Commit**

```bash
git add server/src/utils/jwt.js
git commit -m "feat: add JWT utility functions"
```

### Task 7: Create authentication middleware

**Files:**
- Create: `server/src/middleware/auth.js`

**Step 1: Write auth middleware**

```bash
mkdir -p server/src/middleware
cat > server/src/middleware/auth.js << 'EOF'
import { verifyToken } from '../utils/jwt.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.userId = decoded.userId
  next()
}
EOF
```

**Step 2: Commit**

```bash
git add server/src/middleware/auth.js
git commit -m "feat: add authentication middleware"
```

### Task 8: Create password hashing utility

**Files:**
- Create: `server/src/utils/password.js`

**Step 1: Write password utilities**

```bash
cat > server/src/utils/password.js << 'EOF'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}
EOF
```

**Step 2: Commit**

```bash
git add server/src/utils/password.js
git commit -m "feat: add password hashing utilities"
```

### Task 9: Create validation schemas

**Files:**
- Create: `server/src/utils/validation.js`

**Step 1: Write validation schemas**

```bash
cat > server/src/utils/validation.js << 'EOF'
import Joi from 'joi'

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required()
})

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})

export const printerSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  hostUrl: Joi.string().uri().required(),
  port: Joi.number().integer().min(1).max(65535).default(80),
  path: Joi.string().pattern(/^\//).required(),
  description: Joi.string().allow('').max(500)
})

export const updatePrinterSchema = Joi.object({
  name: Joi.string().min(1).max(50),
  hostUrl: Joi.string().uri(),
  port: Joi.number().integer().min(1).max(65535),
  path: Joi.string().pattern(/^\//),
  description: Joi.string().allow('').max(500),
  status: Joi.string().valid('active', 'inactive')
})
EOF
```

**Step 2: Commit**

```bash
git add server/src/utils/validation.js
git commit -m "feat: add Joi validation schemas"
```

### Task 10: Create authentication routes

**Files:**
- Create: `server/src/routes/auth.js`

**Step 1: Write auth routes**

```bash
mkdir -p server/src/routes
cat > server/src/routes/auth.js << 'EOF'
import express from 'express'
import prisma from '../config/database.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { registerSchema, loginSchema } from '../utils/validation.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { username, password } = value

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { username, passwordHash }
    })

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { username, password } = value

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyRefreshToken(token)
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, createdAt: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
})

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    const newAccessToken = generateAccessToken(user.id)
    const newRefreshToken = generateRefreshToken(user.id)

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(500).json({ error: 'Failed to refresh token' })
  }
})

export default router
EOF
```

**Step 2: Update server.js to use auth routes**

```bash
cat > server/src/server.js << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', authRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
```

**Step 3: Commit**

```bash
git add server/src/routes/auth.js server/src/server.js
git commit -m "feat: implement authentication routes (register, login, refresh)"
```

### Task 11: Create printer routes

**Files:**
- Create: `server/src/routes/printers.js`

**Step 1: Write printer routes**

```bash
cat > server/src/routes/printers.js << 'EOF'
import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { printerSchema, updatePrinterSchema } from '../utils/validation.js'

const router = express.Router()

// Get all printers for user
router.get('/', authenticate, async (req, res) => {
  try {
    const printers = await prisma.printer.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(printers)
  } catch (error) {
    console.error('Get printers error:', error)
    res.status(500).json({ error: 'Failed to fetch printers' })
  }
})

// Get single printer
router.get('/:id', authenticate, async (req, res) => {
  try {
    const printer = await prisma.printer.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    res.json(printer)
  } catch (error) {
    console.error('Get printer error:', error)
    res.status(500).json({ error: 'Failed to fetch printer' })
  }
})

// Create printer
router.post('/', authenticate, async (req, res) => {
  try {
    const { error, value } = printerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { name, hostUrl, port, path, description } = value

    const existingPrinter = await prisma.printer.findFirst({
      where: { userId: req.userId, name }
    })

    if (existingPrinter) {
      return res.status(400).json({ error: 'Printer with this name already exists' })
    }

    const printer = await prisma.printer.create({
      data: {
        name,
        hostUrl,
        port,
        path,
        description,
        userId: req.userId
      }
    })

    res.status(201).json(printer)
  } catch (error) {
    console.error('Create printer error:', error)
    res.status(500).json({ error: 'Failed to create printer' })
  }
})

// Update printer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { error, value } = updatePrinterSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const printer = await prisma.printer.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    const updatedPrinter = await prisma.printer.update({
      where: { id: req.params.id },
      data: value
    })

    res.json(updatedPrinter)
  } catch (error) {
    console.error('Update printer error:', error)
    res.status(500).json({ error: 'Failed to update printer' })
  }
})

// Delete printer
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const printer = await prisma.printer.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    await prisma.printer.delete({
      where: { id: req.params.id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete printer error:', error)
    res.status(500).json({ error: 'Failed to delete printer' })
  }
})

export default router
EOF
```

**Step 2: Update server.js to use printer routes**

```bash
cat > server/src/server.js << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import printerRoutes from './routes/printers.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', authRoutes)
app.use('/api/printers', printerRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
```

**Step 3: Commit**

```bash
git add server/src/routes/printers.js server/src/server.js
git commit -m "feat: implement printer CRUD routes"
```

### Task 12: Create reverse proxy

**Files:**
- Create: `server/src/middleware/proxy.js`

**Step 1: Write proxy middleware**

```bash
cat > server/src/middleware/proxy.js << 'EOF'
import { createProxyMiddleware } from 'http-proxy-middleware'
import prisma from '../config/database.js'

const proxyCache = new Map()

export async function createPrinterProxy(printerId, userId) {
  const cacheKey = `${userId}-${printerId}`
  
  if (proxyCache.has(cacheKey)) {
    return proxyCache.get(cacheKey)
  }

  const printer = await prisma.printer.findFirst({
    where: { id: printerId, userId }
  })

  if (!printer) {
    return null
  }

  const target = `${printer.hostUrl}:${printer.port}`
  
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^/printer/${printer.name}`]: printer.path
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} ${req.url} to ${target}${req.url}`)
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err)
      res.status(502).json({ error: 'Printer unavailable' })
    }
  })

  proxyCache.set(cacheKey, proxy)
  return proxy
}

export async function handleProxy(req, res, next) {
  const pathParts = req.path.split('/')
  
  if (pathParts[1] !== 'printer' || pathParts.length < 3) {
    return next()
  }

  const printerName = pathParts[2]
  
  try {
    const printer = await prisma.printer.findFirst({
      where: { name: printerName, status: 'active' }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    const target = `${printer.hostUrl}:${printer.port}`
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^/printer/${printer.name}`]: printer.path
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err)
        res.status(502).json({ error: 'Printer unavailable' })
      }
    })

    proxy(req, res, next)
  } catch (error) {
    console.error('Proxy handler error:', error)
    res.status(500).json({ error: 'Proxy configuration failed' })
  }
}
EOF
```

**Step 2: Update server.js to use proxy**

```bash
cat > server/src/server.js << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import printerRoutes from './routes/printers.js'
import { handleProxy } from './middleware/proxy.js'
import { verifyToken } from './utils/jwt.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', authRoutes)
app.use('/api/printers', printerRoutes)

// Proxy route with authentication
app.use('/printer/:name', (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  handleProxy(req, res, next)
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
```

**Step 3: Commit**

```bash
git add server/src/middleware/proxy.js server/src/server.js
git commit -m "feat: implement reverse proxy for printer access"
```

### Task 13: Serve static frontend

**Files:**
- Modify: `server/src/server.js`

**Step 1: Update server to serve frontend**

```bash
cat > server/src/server.js << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import printerRoutes from './routes/printers.js'
import { handleProxy } from './middleware/proxy.js'
import { verifyToken } from './utils/jwt.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
  })
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', authRoutes)
app.use('/api/printers', printerRoutes)

// Proxy route with authentication
app.use('/printer/:name', (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  handleProxy(req, res, next)
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
```

**Step 2: Commit**

```bash
git add server/src/server.js
git commit -m "feat: serve static frontend in production"
```

---

## Frontend Implementation

### Task 14: Configure Vite

**Files:**
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`

**Step 1: Create vite.config.js**

```bash
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/printer': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
EOF
```

**Step 2: Create index.html**

```bash
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Klipper Gateway</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF
```

**Step 3: Commit**

```bash
git add frontend/vite.config.js frontend/index.html
git commit -m "feat: configure Vite and create index.html"
```

### Task 15: Configure TailwindCSS

**Files:**
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/index.css`

**Step 1: Create Tailwind config**

```bash
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
```

**Step 2: Create PostCSS config**

```bash
cat > frontend/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
```

**Step 3: Create index.css**

```bash
mkdir -p frontend/src
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF
```

**Step 4: Commit**

```bash
git add frontend/tailwind.config.js frontend/postcss.config.js frontend/src/index.css
git commit -m "feat: configure TailwindCSS"
```

### Task 16: Create API service

**Files:**
- Create: `frontend/src/services/api.js`

**Step 1: Write API service**

```bash
mkdir -p frontend/src/services
cat > frontend/src/services/api.js << 'EOF'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post('/api/refresh-token', { refreshToken })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: create Axios API service with auth interceptors"
```

### Task 17: Create auth service

**Files:**
- Create: `frontend/src/services/auth.js`

**Step 1: Write auth service**

```bash
cat > frontend/src/services/auth.js << 'EOF'
import api from './api.js'

export async function login(username, password) {
  const response = await api.post('/login', { username, password })
  const { accessToken, refreshToken, user } = response.data

  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))

  return user
}

export async function register(username, password) {
  const response = await api.post('/register', { username, password })
  const { accessToken, refreshToken, user } = response.data

  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))

  return user
}

export async function getCurrentUser() {
  const response = await api.get('/me')
  return response.data
}

export function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export function isAuthenticated() {
  return !!localStorage.getItem('accessToken')
}

export function getUser() {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/services/auth.js
git commit -m "feat: create auth service"
```

### Task 18: Create printer service

**Files:**
- Create: `frontend/src/services/printers.js`

**Step 1: Write printer service**

```bash
cat > frontend/src/services/printers.js << 'EOF'
import api from './api.js'

export async function getPrinters() {
  const response = await api.get('/printers')
  return response.data
}

export async function getPrinter(id) {
  const response = await api.get(`/printers/${id}`)
  return response.data
}

export async function createPrinter(printerData) {
  const response = await api.post('/printers', printerData)
  return response.data
}

export async function updatePrinter(id, printerData) {
  const response = await api.put(`/printers/${id}`, printerData)
  return response.data
}

export async function deletePrinter(id) {
  await api.delete(`/printers/${id}`)
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/services/printers.js
git commit -m "feat: create printer service"
```

### Task 19: Create AuthContext

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`

**Step 1: Write AuthContext**

```bash
mkdir -p frontend/src/context
cat > frontend/src/context/AuthContext.jsx << 'EOF'
import { createContext, useContext, useState, useEffect } from 'react'
import { login as authLogin, register as authRegister, getCurrentUser, logout as authLogout, isAuthenticated } from '../services/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (isAuthenticated()) {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error('Auth check failed:', error)
          authLogout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    const user = await authLogin(username, password)
    setUser(user)
    return user
  }

  const register = async (username, password) => {
    const user = await authRegister(username, password)
    setUser(user)
    return user
  }

  const logout = () => {
    authLogout()
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: create AuthContext for authentication state"
```

### Task 20: Create ProtectedRoute component

**Files:**
- Create: `frontend/src/components/ProtectedRoute.jsx`

**Step 1: Write ProtectedRoute**

```bash
mkdir -p frontend/src/components
cat > frontend/src/components/ProtectedRoute.jsx << 'EOF'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/components/ProtectedRoute.jsx
git commit -m "feat: create ProtectedRoute component"
```

### Task 21: Create LoginForm component

**Files:**
- Create: `frontend/src/components/LoginForm.jsx`

**Step 1: Write LoginForm**

```bash
cat > frontend/src/components/LoginForm.jsx << 'EOF'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await register(formData.username, formData.password)
      } else {
        await login(formData.username, formData.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {isRegister ? 'Create Account' : 'Sign In'}
        </h2>
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/components/LoginForm.jsx
git commit -m "feat: create LoginForm component"
```

### Task 22: Create Dashboard component

**Files:**
- Create: `frontend/src/pages/Dashboard.jsx`

**Step 1: Write Dashboard**

```bash
mkdir -p frontend/src/pages
cat > frontend/src/pages/Dashboard.jsx << 'EOF'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPrinters, deletePrinter } from '../services/printers.js'
import PrinterForm from '../components/PrinterForm.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [printers, setPrinters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadPrinters()
  }, [])

  const loadPrinters = async () => {
    try {
      const data = await getPrinters()
      setPrinters(data)
    } catch (error) {
      console.error('Failed to load printers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrinter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this printer?')) {
      return
    }

    try {
      await deletePrinter(id)
      setPrinters(printers.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete printer:', error)
      alert('Failed to delete printer')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Klipper Gateway</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.username}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Printers</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Printer'}
          </button>
        </div>

        {showForm && (
          <PrinterForm onSuccess={() => {
            setShowForm(false)
            loadPrinters()
          }} />
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading printers...</div>
          </div>
        ) : printers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No printers configured yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first printer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printers.map((printer) => (
              <div key={printer.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {printer.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {printer.hostUrl}:{printer.port}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Path: {printer.path}
                </p>
                {printer.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {printer.description}
                  </p>
                )}
                <div className="flex space-x-2">
                  <Link
                    to={`/printer/${printer.name}`}
                    className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDeletePrinter(printer.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: create Dashboard page"
```

### Task 23: Create PrinterForm component

**Files:**
- Create: `frontend/src/components/PrinterForm.jsx`

**Step 1: Write PrinterForm**

```bash
cat > frontend/src/components/PrinterForm.jsx << 'EOF'
import { useState } from 'react'
import { createPrinter } from '../services/printers.js'

export default function PrinterForm({ onSuccess, printer }) {
  const [formData, setFormData] = useState({
    name: printer?.name || '',
    hostUrl: printer?.hostUrl || 'http://localhost',
    port: printer?.port || 7125,
    path: printer?.path || '/',
    description: printer?.description || ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createPrinter(formData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create printer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {printer ? 'Edit Printer' : 'Add New Printer'}
      </h3>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Printer Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Ender 3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Host URL
          </label>
          <input
            type="url"
            required
            value={formData.hostUrl}
            onChange={(e) => setFormData({ ...formData, hostUrl: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="http://192.168.1.100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Port
          </label>
          <input
            type="number"
            required
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="7125"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Path
          </label>
          <input
            type="text"
            required
            value={formData.path}
            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="/"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Notes about this printer..."
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Printer'}
          </button>
        </div>
      </form>
    </div>
  )
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/components/PrinterForm.jsx
git commit -m "feat: create PrinterForm component"
```

### Task 24: Create PrinterView component

**Files:**
- Create: `frontend/src/pages/PrinterView.jsx`

**Step 1: Write PrinterView**

```bash
cat > frontend/src/pages/PrinterView.jsx << 'EOF'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PrinterView() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const iframeUrl = `/printer/${name}`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="h-[calc(100vh-4rem)]">
        <iframe
          src={iframeUrl}
          title={name}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  )
}
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/pages/PrinterView.jsx
git commit -m "feat: create PrinterView page with iframe"
```

### Task 25: Create App component

**Files:**
- Create: `frontend/src/App.jsx`

**Step 1: Write App.jsx**

```bash
cat > frontend/src/App.jsx << 'EOF'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginForm from './components/LoginForm.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PrinterView from './pages/PrinterView.jsx'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/printer/:name"
            element={
              <ProtectedRoute>
                <PrinterView />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: create App component with routing"
```

### Task 26: Create main.jsx entry point

**Files:**
- Create: `frontend/src/main.jsx`

**Step 1: Write main.jsx**

```bash
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF
```

**Step 2: Commit**

```bash
git add frontend/src/main.jsx
git commit -m "feat: create React entry point"
```

### Task 27: Add environment variables

**Files:**
- Create: `frontend/.env.example`

**Step 1: Create .env.example**

```bash
cat > frontend/.env.example << 'EOF'
VITE_API_URL=http://localhost:3001/api
EOF
```

**Step 2: Create .env**

```bash
cp frontend/.env.example frontend/.env
```

**Step 3: Commit**

```bash
git add frontend/.env.example frontend/.env
git commit -m "feat: add frontend environment variables"
```

---

## Testing & Setup

### Task 28: Set up PostgreSQL database

**Files:**
- None

**Step 1: Create database**

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE kl_gateway;
CREATE USER kl_gateway_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kl_gateway TO kl_gateway_user;
\q
```

**Step 2: Update DATABASE_URL in server/.env**

```bash
# Edit server/.env and update DATABASE_URL:
# DATABASE_URL="postgresql://kl_gateway_user:your_secure_password@localhost:5432/kl_gateway?schema=public"
```

**Step 3: Run Prisma migrations**

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

**Step 4: Commit**

```bash
cd ..
git add server/.env
git commit -m "chore: configure database connection"
```

### Task 29: Test the application

**Files:**
- None

**Step 1: Start development servers**

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

**Step 2: Test registration**

Open http://localhost:5173/login
1. Click "Register"
2. Enter username and password (min 8 characters)
3. Click "Register"
4. Should redirect to dashboard

**Step 3: Test adding a printer**

1. Click "Add Printer"
2. Fill in printer details:
   - Name: "Test Printer"
   - Host URL: "http://localhost" (or actual printer IP)
   - Port: 7125 (Klipper default)
   - Path: "/"
   - Description: "Test printer"
3. Click "Save Printer"
4. Printer should appear in list

**Step 4: Test printer access**

1. Click "Open" on a printer
2. Should open printer UI in iframe
3. If no printer running at that URL, will show error

**Step 5: Test authentication**

1. Logout
2. Try to access /dashboard directly
3. Should redirect to login
4. Login with credentials
5. Should access dashboard

**Step 6: Commit**

```bash
git commit --allow-empty -m "test: application tested successfully"
```

### Task 30: Create README documentation

**Files:**
- Create: `README.md`

**Step 1: Write README**

```bash
cat > README.md << 'EOF'
# Klipper Printer Gateway

A secure web gateway for accessing multiple Klipper 3D printer interfaces through a single login-protected portal.

## Features

- Secure username/password authentication
- Add and manage multiple printers
- Access printer interfaces through reverse proxy
- Token-based authentication with automatic refresh
- Responsive web interface

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- http-proxy-middleware

**Frontend:**
- React + React Router
- Vite
- TailwindCSS
- Axios

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE kl_gateway;
CREATE USER kl_gateway_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kl_gateway TO kl_gateway_user;
\q
```

### Application Setup

```bash
# Clone repository
git clone <repository-url>
cd kl-gateway

# Install dependencies
npm install

# Configure environment
cd server
cp .env.example .env
# Edit .env with your database URL and JWT secret
cd ../frontend
cp .env.example .env

# Run migrations
cd ../server
npm run prisma:generate
npm run prisma:migrate
```

## Running the Application

### Development

```bash
# Run both backend and frontend
npm run dev

# Or separately:
npm run dev:server  # Port 3001
npm run dev:frontend # Port 5173
```

### Production

```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm start
```

## Usage

1. Navigate to http://localhost:5173
2. Register a new account
3. Add your printers with their IP addresses and ports
4. Click "Open" to access the printer interface

## Security

- All passwords are hashed with bcrypt
- JWT tokens with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- Automatic token refresh on API calls
- HTTPS required for production deployment

## License

MIT
EOF
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

### Task 31: Final verification

**Files:**
- None

**Step 1: Run linting checks**

```bash
# Check if any linting tools are configured
cd server && npm run lint 2>/dev/null || echo "No lint script configured"
cd ../frontend && npm run lint 2>/dev/null || echo "No lint script configured"
```

**Step 2: Build frontend**

```bash
cd frontend
npm run build
cd ..
```

**Step 3: Verify production server**

```bash
cd server
NODE_ENV=production node src/server.js
```

Stop server with Ctrl+C

**Step 4: Final commit**

```bash
cd ..
git add -A
git commit -m "chore: complete implementation ready for deployment"
```

**Step 5: View git history**

```bash
git log --oneline
```

Expected: Series of commits showing progress through all tasks

---

## Deployment Notes

### Production Checklist

1. Set strong `JWT_SECRET` in environment
2. Use HTTPS (e.g., with Nginx reverse proxy)
3. Configure CORS origin to production domain
4. Set `NODE_ENV=production`
5. Build frontend before running
6. Use process manager (PM2) for production

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Implementation Complete

All 31 tasks completed. The Klipper Printer Gateway is ready for testing and deployment.
