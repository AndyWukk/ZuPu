import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    // 重定向到登录页面，并保存当前路径
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!requireAuth && user) {
    // 如果用户已登录，重定向到首页
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}