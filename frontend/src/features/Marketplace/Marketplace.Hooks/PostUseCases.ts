import type { PostRepository, PostUseCases } from '@/features/Marketplace/Marketplace.Hooks/PostUseCases';
import type { Post, PostFilters } from '@/features/Marketplace/Marketplace.Types/Post'

export class PostUseCasesImpl implements PostUseCases {
  constructor(private postRepository: PostRepository) {}

  async getPostsWithFilters(
    filters: PostFilters, 
    page: number = 1, 
    limit: number = 9
  ): Promise<{
    posts: Post[]
    hasMore: boolean
    totalCount: number
  }> {
    try {
      const result = await this.postRepository.findAll(filters, page, limit)
      
      // Aplicar reglas de negocio específicas aquí si es necesario
      const processedPosts = result.posts.map(post => ({
        ...post,
        // Ejemplo: formatear precios, validar datos, etc.
        price: post.price ? this.formatPrice(post.price) : undefined
      }))

      return {
        posts: processedPosts,
        hasMore: result.hasMore,
        totalCount: result.totalCount
      }
    } catch (error) {
      console.error('Error fetching posts with filters:', error)
      throw new Error('Failed to fetch posts')
    }
  }

  async getPostById(id: number): Promise<Post | null> {
    try {
      return await this.postRepository.findById(id)
    } catch (error) {
      console.error('Error fetching post by id:', error)
      throw new Error('Failed to fetch post')
    }
  }

  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    try {
      // Aplicar validaciones de dominio antes de crear
      this.validatePostData(postData)
      return await this.postRepository.create(postData)
    } catch (error) {
      console.error('Error creating post:', error)
      throw new Error('Failed to create post')
    }
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post> {
    try {
      return await this.postRepository.update(id, postData)
    } catch (error) {
      console.error('Error updating post:', error)
      throw new Error('Failed to update post')
    }
  }

  async deletePost(id: number): Promise<void> {
    try {
      await this.postRepository.delete(id)
    } catch (error) {
      console.error('Error deleting post:', error)
      throw new Error('Failed to delete post')
    }
  }

  // Métodos privados para reglas de negocio
  private formatPrice(price: string): string {
    // Lógica de formateo de precios
    return price.startsWith('$') ? price : `$${price}`
  }

  private validatePostData(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!postData.title.trim()) {
      throw new Error('Post title is required')
    }
    if (!postData.description.trim()) {
      throw new Error('Post description is required')
    }
    if (!postData.categoryId) {
      throw new Error('Post category is required')
    }
  }
}