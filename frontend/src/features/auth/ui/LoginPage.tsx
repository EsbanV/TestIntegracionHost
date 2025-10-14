import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginInstitutional from './LoginInstitutional'

export default function LoginPage() {
  const navigate = useNavigate()

  // Si ya existe una sesión previa (token guardado), redirigir al home
  useEffect(() => {
    try {
      const token = localStorage.getItem('google_credential')
      if (token) navigate('/home', { replace: true })
    } catch {}
  }, [navigate])

  async function handleOAuth() {
    // Aquí en el futuro podrás intercambiar el credential por un token propio en backend
    // y guardar lo necesario en tu estado global. Luego de eso, redirigimos al Home.
    navigate('/home', { replace: true })
  }
  return <LoginInstitutional onOAuth={handleOAuth} />
}
