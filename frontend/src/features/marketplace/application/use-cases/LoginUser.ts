import type { User } from '../../features/auth/ui/entities/User'

export type Credentials = {
  email: string
  password: string
}

export interface IUserRepository {
  login(credentials: Credentials): Promise<User>
}

export class LoginUser {
  private repo: IUserRepository

  constructor(repo: IUserRepository) {
    this.repo = repo
  }

  async execute(credentials: Credentials): Promise<User> {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required')
    }
    // Simple business rule: email must contain @
    if (!credentials.email.includes('@')) {
      throw new Error('Invalid email')
    }
    const user = await this.repo.login(credentials)
    return user
  }
}
