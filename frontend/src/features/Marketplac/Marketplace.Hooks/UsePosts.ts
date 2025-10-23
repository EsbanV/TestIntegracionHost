// src/features/marketplace/hooks/usePosts.ts
import { useQuery } from '@tanstack/react-query'
import { PostUseCases } from '../features/marketplace/repositories/PostUseCases'
import { PostRepository } from '../Marketplace.Repositories/PostRepository'

const usePosts = () => {
  const repo = new PostRepository()
  const usecase = new PostUseCases(repo)

  return useQuery({
    queryKey: ['posts'],
    queryFn: () => usecase.getAllPosts(),
  })
}

export default usePosts
