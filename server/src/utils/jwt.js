import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m'
const REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d'
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production')
  }
  console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!')
}

const DEFAULT_JWT_SECRET = 'default-secret-change-in-production'

/**
 * Generates an access token for a user
 * @param {string|number} userId - The user ID to encode in the token
 * @returns {string} The signed JWT access token
 * @throws {Error} If userId is not provided
 */
export function generateAccessToken(userId) {
  if (!userId) {
    throw new Error('userId required')
  }
  return jwt.sign({ userId }, JWT_SECRET || DEFAULT_JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION })
}

/**
 * Generates a refresh token for a user
 * @param {string|number} userId - The user ID to encode in the token
 * @returns {string} The signed JWT refresh token
 * @throws {Error} If userId is not provided
 */
export function generateRefreshToken(userId) {
  if (!userId) {
    throw new Error('userId required')
  }
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET || DEFAULT_JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION })
}

/**
 * Verifies and decodes an access token
 * @param {string} token - The JWT token to verify
 * @returns {object|null} The decoded token payload, or null if invalid/expired
 * @throws {Error} If token is not provided
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('token must be a non-empty string')
  }
  try {
    return jwt.verify(token, JWT_SECRET || DEFAULT_JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Verifies and decodes a refresh token
 * @param {string} token - The JWT token to verify
 * @returns {object|null} The decoded token payload, or null if invalid/expired or not a refresh token
 * @throws {Error} If token is not provided
 */
export function verifyRefreshToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('token must be a non-empty string')
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET || DEFAULT_JWT_SECRET)
    if (decoded.type !== 'refresh') {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}
