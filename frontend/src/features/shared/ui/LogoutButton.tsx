import { useAuth } from '@/app/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LogoutButton() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    if (confirm(`¿Cerrar sesión de ${user?.correo}?`)) {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-all"
      title="Cerrar sesión"
    >
      <span>Salir</span>
    </button>
  )
}
