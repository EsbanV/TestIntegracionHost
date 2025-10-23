import { useInfiniteQuery } from '@tanstack/react-query'
// Asumimos que Post es el tipo que describe la tarjeta (con title, image, etc.)
import type { Post, PostFilters } from '@/features/Marketplac/Marketplace.Types/Post' 
// [AJUSTE] Asumo que PostHttpRepository llama al método 'list' en lugar de 'findAll' 
// y maneja los filtros como el tercer argumento (filters).
import { PostHttpRepository } from '@/features/Marketplac/Marketplace.Repositories/PostHttpRepository'

// Definimos la estructura del objeto que devuelve el Repositorio de Frontend
type PagedProductResult = {
  items: Post[] // Contiene la lista de productos (mapeados a la estructura de Post)
  totalCount: number // El total de resultados disponibles
  hasMore: boolean // Indica si hay más páginas
}

type Key = ['posts', { search: string; categoryId: string }]

export function useInfinitePosts(filters: { search: string; categoryId: string }, pageSize = 9) {
  // [AJUSTE] Usar la clase del repositorio existente
  const repo = new PostHttpRepository()

  // [AJUSTE] El tipo de retorno ahora es el PagedProductResult
  return useInfiniteQuery<PagedProductResult, Error, ReturnType<typeof mapPages>>({
    queryKey: ['posts', { search: filters.search, categoryId: filters.categoryId }] as Key,
    
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1
      
      // Creamos un objeto de filtros mapeado al formato que el Repositorio espera
      const mappedFilters: PostFilters = {
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
      }
      
      // [AJUSTE CLAVE] Llamar al método 'list' (que es el implementado para el listado)
      // Pasamos los filtros, la página y el límite.
      // NOTA: El repositorio debe manejar estos argumentos correctamente.
      return repo.list(page, pageSize, mappedFilters) 
    },
    
    // Función para determinar si hay una siguiente página
    getNextPageParam: (lastPage, allPages) =>
      // Usamos la propiedad hasMore devuelta por el Repositorio
      lastPage.hasMore ? allPages.length + 1 : undefined, 
      
    select: mapPages,
    staleTime: 30_000,
  })
}

// La función de mapeo se mantiene similar, usando 'items' en lugar de 'posts'
function mapPages(data: { pages: Array<PagedProductResult> }) {
  // Aplanar todos los arrays de 'items' de cada página
  const flat = data.pages.flatMap(p => p.items) 
  // Obtener el totalCount de la primera página
  const total = data.pages.at(0)?.totalCount ?? flat.length
  // Obtener hasMore de la última página
  const hasMore = data.pages.at(-1)?.hasMore ?? false
  
  return { items: flat, total, hasMore }
}