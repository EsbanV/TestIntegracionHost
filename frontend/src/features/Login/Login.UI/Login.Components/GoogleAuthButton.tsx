import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function GoogleAuthButton() {
  async function onSuccess(cred: CredentialResponse) {
    const idToken = cred.credential
    if (!idToken) return alert('No se recibió token de Google')

    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
    })
    if (!res.ok) {
      const t = await res.text()
      return alert(`Error login: ${res.status} ${t}`)
    }
    const data = await res.json()
    // guarda JWT propio de tu app
    localStorage.setItem('token', data.token)
    // aquí actualiza tu store de usuario si tienes (context/redux, etc.)
    console.log('Usuario autenticado:', data.user)
  }

  return <GoogleLogin onSuccess={onSuccess} onError={() => alert('Error con Google')} />
}
