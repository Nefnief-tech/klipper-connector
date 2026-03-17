import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/15" />
          <div className="absolute inset-0 w-14 h-14 border-3 border-primary/30 rounded-full" />
          <div className="absolute inset-0 w-14 h-14 border-3 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
