import type { Credentials } from '../use-cases/LoginUser'
import type { User } from '../../../types/User'

const API = import.meta.env.VITE_API_URL;

export async function loginOrRegister(credentials: Credentials): Promise<User> {
  const res = await fetch(`${API}/api/auth/login-or-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('app_token', data.token);
  return {
    id: data.user.id,
    email: data.user.emailInstitucional,
    name: data.user.nombre,
    token: data.token,
  };
}

export async function googleSignIn(credential: string): Promise<User> {
  const res = await fetch(`${API}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('app_token', data.token);
  return {
    id: data.user.id,
    email: data.user.emailInstitucional,
    name: data.user.nombre,
    token: data.token,
  };
}
