import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Asumiendo que tienes tu helper 'api'
import type { PaginaDeProductos, ProductosFiltros } from '../Marketplace.Types/product';

// La función que llama a la API
const getProductos = async ({ 
  busqueda, 
  categoriaId, 
  cursor = 0 
}: ProductosFiltros): Promise<PaginaDeProductos> => {
  
  const params = new URLSearchParams();
  params.set('cursor', String(cursor));
  params.set('limit', '12'); // 12 productos por página
  
  if (busqueda) params.set('busqueda', busqueda);
  if (categoriaId) params.set('categoriaId', String(categoriaId));
  
  // Asume que tu API devuelve un objeto PaginaDeProductos
  return api.get<PaginaDeProductos>(`/api/productos?${params.toString()}`);
};

/**
 * Hook para cargar productos con scroll infinito.
 * Reemplaza a 'useProductsWithFilters'.
 */
export const useProductos = (filtros: Omit<ProductosFiltros, 'cursor'>) => {
  return useInfiniteQuery<PaginaDeProductos, Error>({
    // La queryKey identifica esta query. Cambia si los filtros cambian.
    queryKey: ['productos', filtros], 
    
    // pageParam es el cursor. Inicia en 0 (o undefined).
    queryFn: ({ pageParam = 0 }) => getProductos({ ...filtros, cursor: pageParam }),
    
    // 'getNextPageParam' le dice a React Query cuál es el cursor para la *siguiente* página.
    // Lo sacamos de la 'lastPage' (la última página que recibimos).
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};