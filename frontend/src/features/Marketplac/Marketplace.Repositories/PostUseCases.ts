// src/features/marketplace/application/use-cases/PostUseCases.ts
import { Post } from '@/features/Marketplac/Marketplace.Types/Post'
import { PostRepository } from '../../Marketplac/Marketplace.Repositories/PostRepository'

export class PostUseCases {
  private repo: PostRepository

  constructor(repo: PostRepository) {
    this.repo = repo
  }

  async getAllPosts(): Promise<Post[]> {
    return this.repo.getAll()
  }

  async getPostById(id: number): Promise<Post> {
    return this.repo.getById(id)
  }
}
