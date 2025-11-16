import { useCallback, useMemo, useRef, useState } from 'react'
import type { User } from '@/features/Login/Login.Types/User'

type ExchangeResponse = {
  user?: User
  token?: string
  // any additional fields returned by your API
  [k: string]: any
}

function resolveAuthUrl() {
  const fromEnv = import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined
  const api = import.meta.env.VITE_API_URL as string | undefined
  if (fromEnv) return fromEnv
  if (api) return `${api.replace(/\/$/, '')}/auth/google`
  // Fallback al prefijo /api si no hay envs definidos
  return '/api/auth/google'
}

// Decodifica el JWT emitido por Google (resp.credential)
function decodeJwt(token: string): Record<string, any> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid JWT')
    const b64url = parts[1]
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad === 2) b64 += '=='
    else if (pad === 3) b64 += '='
    const json = atob(b64)
    return JSON.parse(json)
  } catch {
    return {}
  }
}

/**
 * Hook to exchange a Google ID Token (credential) for an app session/JWT
 * - Reads the One Tap credential from localStorage key "google_credential" if not provided
 * - Sends POST to your backend and returns the parsed response
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastToken = useRef<string | null>(null)

  const url = useMemo(() => resolveAuthUrl(), [])

  const exchange = useCallback(async (idToken?: string): Promise<ExchangeResponse> => {
    setError(null)
    const token = idToken ?? (() => {
      try { return localStorage.getItem('google_credential') } catch { return null }
    })()
    if (!token) {
      setError('No se encontró idToken de Google.')
      throw new Error('Missing Google idToken')
    }

    // Avoid duplicate exchanges with the same token (double clicks/fast re-renders)
    if (lastToken.current === token) return {}

    // Extrae email y nombre del idToken para cumplir con el backend actual
    const payload = decodeJwt(token)
    const email = String(payload?.email || '')
    const name = String(payload?.name || payload?.given_name || '')
    if (!email) {
      setError('El idToken no contiene email.')
      throw new Error('Google token without email')
    }

    setLoading(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // permitir cookies de sesión
        // Backend actual espera: { idToken, email, name }
        body: JSON.stringify({ idToken: token, email, name }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const msg = text || `HTTP ${res.status}`
        setError(msg)
        throw new Error(msg)
      }

      const data = (await res.json()) as ExchangeResponse

      // Optional: persist JWT returned by the API
      if (data.token) {
        try { localStorage.setItem('token', data.token) } catch {}
      }
      lastToken.current = token
      return data
    } finally {
      setLoading(false)
    }
  }, [url])

  return { exchange, loading, error }
}

export default useGoogleAuth
