import type { PostRepository } from '../features/marketplace/application/interfaces/PostInterfaces'
import type { Product as Post, PostFilters } from '../types/entities'

// TODO: Eliminar datos hardcodeados y obtener categorías desde la API
// Por ahora, mantener datos mock pero sin constantes globales

export class MockPostRepository implements PostRepository {
  async findAll(filters: PostFilters, page: number = 1, limit: number = 9): Promise<{
    posts: Post[]
    hasMore: boolean
    totalCount: number
  }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300))

    const posts = this.generatePosts(page, limit, filters)
    const hasMore = posts.length > 0

    return {
      posts,
      hasMore,
      totalCount: posts.length
    }
  }

  async findById(id: number): Promise<Post | null> {
    await new Promise(resolve => setTimeout(resolve, 200))

    // TODO: Implementar llamada real a la API
    // Por ahora, devolver null para evitar datos mock inconsistentes
    return null
  }

  async create(post: Omit<Post, 'id' | 'fechaAgregado'>): Promise<Post> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const newPost: Post = {
      ...post,
      id: Date.now(), // ID temporal
      fechaAgregado: new Date()
    }

    return newPost
  }

  async update(id: number, postData: Partial<Post>): Promise<Post> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const existingPost = await this.findById(id)
    if (!existingPost) {
      throw new Error('Post not found')
    }

    return {
      ...existingPost,
      ...postData
    }
  }

  async delete(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    // En una implementación real, aquí se eliminaría de la base de datos
    console.log(`Post ${id} deleted`)
  }

  // Método privado para generar posts mock (temporal)
  private generatePosts(page: number, limit: number, filters: PostFilters): Post[] {
    // TODO: Implementar generación de datos mock sin hardcodeo
    // Por ahora, devolver array vacío para evitar inconsistencias
    const posts: Post[] = []

    return posts.filter(post => {
      if (filters.categoryId && post.categoriaId !== filters.categoryId) {
        return false
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesTitle = post.nombre.toLowerCase().includes(searchLower)
        const matchesDescription = post.descripcion?.toLowerCase().includes(searchLower)
        return matchesTitle || (matchesDescription ?? false)
      }

      return true
    })
  }
}