import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginInstitutional from './LoginInstitutional'
import { googleSignIn } from '../api/authApi'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('app_token')
    if (token) navigate('/home', { replace: true })
  }, [navigate])

  async function handleOAuth(credential: string) {
    await googleSignIn(credential)    // guarda token y user
    navigate('/home', { replace: true })
  }

  return <LoginInstitutional onOAuth={handleOAuth} />
}
