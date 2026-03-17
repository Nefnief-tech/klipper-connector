import express from 'express'
import prisma from '../config/database.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { registerSchema, loginSchema } from '../utils/validation.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { username, password } = value

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash
      }
    })

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      token: accessToken,
      refreshToken
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { username, password } = value

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' })
    }

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    res.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      token: accessToken,
      refreshToken
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const { verifyToken } = await import('../utils/jwt.js')
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
        isActive: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    const decoded = verifyRefreshToken(refreshToken)

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    const newAccessToken = generateAccessToken(user.id)
    const newRefreshToken = generateRefreshToken(user.id)

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
