import type { User } from '@/types/User'
import { loginOrRegister } from '../api/authApi'

export type Credentials = { email: string; password: string; nombre?: string }

export class LoginUser {
  async execute(credentials: Credentials): Promise<User> {
    if (!credentials.email) {
      throw new Error('Email are required')
    }
    return loginOrRegister(credentials);
  }
}
