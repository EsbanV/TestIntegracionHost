// src/features/marketplace/hooks/usePosts.ts
import { useQuery } from '@tanstack/react-query'
import { PostUseCases } from './PostUseCases'
import { PostRepository } from '@/features/Marketplace/Marketplace.Repositories/MockPostRepository'

const usePosts = () => {
  const repo = new PostRepository()
  const usecase = new PostUseCases(repo)

  return useQuery({
    queryKey: ['posts'],
    queryFn: () => usecase.getAllPosts(),
  })
}

export default usePosts
