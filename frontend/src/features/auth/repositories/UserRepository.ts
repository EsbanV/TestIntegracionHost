import type { IUserRepository, Credentials } from '../use-cases/LoginUser'
import type { User } from '../entities/User'
import * as api from '../api/authApi'

export class UserRepository implements IUserRepository {
  async login(credentials: Credentials): Promise<User> {
    return api.login(credentials)
  }
}
