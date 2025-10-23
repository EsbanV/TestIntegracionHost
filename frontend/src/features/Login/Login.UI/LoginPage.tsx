import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginInstitutional from './LoginInstitutional'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const token = localStorage.getItem('google_credential')
      if (token) navigate('/home', { replace: true })
    } catch {}
  }, [navigate])

  async function handleOAuth() {
    navigate('/home', { replace: true })
  }
  return <LoginInstitutional onOAuth={handleOAuth} />
}
