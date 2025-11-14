import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Product, PostFilters } from '../../../types/entities'

// Hook personalizado para el manejo de posts con filtros
export const usePostsWithFilters = (filters: PostFilters) => {
  const queryClient = useQueryClient()

  // Crear clave única para la query basada en los filtros
  const queryKey = ['posts', filters.searchTerm, filters.categoryId]

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, filters }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: true, // Siempre habilitado
  })

  // Limpiar cache cuando cambian los filtros significativamente
  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['posts'] })
  }

  // Aplanar todas las páginas en un solo array
  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.posts) ?? []
  }, [data])

  // Información de resultados
  const hasResults = posts.length > 0
  const totalResults = posts.length

  return {
    posts,
    hasResults,
    totalResults,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    clearCache
  }
}

// Función para fetch de posts con simulación de API - SIN LÍMITE ARTIFICIAL
const fetchPosts = async ({
  pageParam = 1,
  filters
}: {
  pageParam?: number
  filters: PostFilters
}): Promise<{ posts: Product[], nextPage: number | undefined, hasMore: boolean }> => {
  console.log(`🔍 Fetching page ${pageParam} with filters:`, filters)

  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300))

  // TODO: Implementar llamada real a la API
  // Por ahora, devolver array vacío para evitar errores
  const posts: Product[] = []

  // SCROLL INFINITO REAL - Sin límite artificial de páginas
  // Solo detener si no hay posts debido a filtros muy restrictivos
  const hasMore = posts.length > 0

  return {
    posts,
    nextPage: hasMore ? pageParam + 1 : undefined,
    hasMore
  }
}

// Hook para debounce
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}