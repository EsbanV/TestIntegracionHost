import type { IUserRepository, Credentials } from '../features/auth/use-cases/LoginUser'
import type { User } from '../types/User'
import * as api from '../features/auth/api/authApi'

export class UserRepository implements IUserRepository {
  async login(credentials: Credentials): Promise<User> {
    return api.login(credentials)
  }
}
