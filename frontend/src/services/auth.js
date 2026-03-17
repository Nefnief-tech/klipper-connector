import api from './api'

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

export const register = async (username, password) => {
  const response = await api.post('/auth/register', { username, password })
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}
