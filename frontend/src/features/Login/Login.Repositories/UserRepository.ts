import type { IUserRepository, Credentials } from '@/features/Login/Login.Types/LoginUser'
import type { User } from '@/features/Login/Login.Types/User'
import * as api from '@/features/Login/Login.Utils/authApi'

export class UserRepository implements IUserRepository {
  async login(credentials: Credentials): Promise<User> {
    return api.login(credentials)
  }
}
