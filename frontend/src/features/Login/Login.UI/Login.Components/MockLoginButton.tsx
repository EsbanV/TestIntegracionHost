import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/context/AuthContext'

export default function MockLoginButton() {
  const [email, setEmail] = useState('demo@uct.cl')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function doLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      login(data.token, data.user)
      navigate('/home', { replace: true })
    } catch (err) {
      alert('No se pudo iniciar sesión (mock)')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={doLogin} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        placeholder="tu@uct.cl"
        className="border rounded px-3 py-2"
        required
      />
      <button type="submit" disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        {loading ? 'Entrando…' : 'Entrar (dev)'}
      </button>
    </form>
  )
}
