// src/features/marketplace/repositories/PostRepository.ts
import { Post } from '@/features/Login/Login.Types/Post'

export class PostRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  async getAll(): Promise<Post[]> {
    const res = await fetch(`${this.baseUrl}/posts`)
    if (!res.ok) throw new Error('Error al obtener posts')
    return res.json()
  }

  async getById(id: number): Promise<Post> {
    const res = await fetch(`${this.baseUrl}/posts/${id}`)
    if (!res.ok) throw new Error('Post no encontrado')
    return res.json()
  }

  // puedes añadir create/update/delete si los usas
}
