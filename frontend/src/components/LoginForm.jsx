import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'

const LoginForm = () => {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isRegister) {
      if (username.length < 3) {
        setError('Username must be at least 3 characters long')
        return
      }
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        setError('Username must be alphanumeric')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }
    }

    setLoading(true)

    try {
      if (isRegister) {
        await register(username, password)
      } else {
        await login(username, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Static gradient background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 via-orange-500/8 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tr from-purple-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 animate-fade-in relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-orange-500/20 to-pink-500/30 rounded-3xl blur-2xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-primary/30">
            <span className="text-4xl font-bold text-white">KL</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10 animate-fade-in relative z-10" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-muted-foreground">
          {isRegister
            ? 'Start managing your 3D printers'
            : 'Sign in to access your gateway'}
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md animate-slide-up relative z-10" style={{ animationDelay: '0.2s' }}>
        <div className="card p-8 glass">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Enter your username"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isRegister ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-border/50">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-14 text-sm text-muted-foreground/70 animate-fade-in relative z-10" style={{ animationDelay: '0.3s' }}>
        Klipper Gateway
      </p>
    </div>
  )
}

export default LoginForm
