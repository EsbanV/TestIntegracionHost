// src/features/auth/ui/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/context/AuthContext'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const token = params.get('token')
    if (!token) return navigate('/login', { replace: true })

    // Podrías pedir /me al backend para obtener user; o decodificar si lo incluyes en el token
    // Aquí hago una llamada opcional a /api/me
    ;(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const user = res.ok ? await res.json() : { id: 0, nombre: 'Usuario', correo: '' }
        login(token, user)
        navigate('/home', { replace: true })
      } catch {
        navigate('/login', { replace: true })
      }
    })()
  }, [params, navigate, login])

  return <p>Autenticando…</p>
}
