// ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  const token = localStorage.getItem('app_token')
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
