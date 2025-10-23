import type { Credentials } from '../Login.Types/LoginUser'
import type { User } from '../../Perfil/Perfil.Types/User'

export async function login(credentials: Credentials): Promise<User> {
  await new Promise((r) => setTimeout(r, 500))

  if (!credentials.email.includes('@')) {
    throw new Error('Invalid email format')
  }

  return {
    id: 'u-1',
    email: credentials.email,
    name: 'Demo User',
    token: 'fake-token-123',
  }
}
