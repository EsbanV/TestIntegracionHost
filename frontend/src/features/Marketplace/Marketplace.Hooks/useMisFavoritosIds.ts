import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// La API devuelve un array de números: [1, 5, 23]
const getFavoritosIds = async (): Promise<number[]> => {
  return api.get<number[]>('/api/favoritos/ids');
};

/**
 * Hook para obtener los IDs de los productos favoritos del usuario.
 * Devuelve un Set<number> para búsquedas rápidas (O(1)).
 */
export const useMisFavoritosIds = () => {
  return useQuery<number[], Error, Set<number>>({ // El 3er genérico es el tipo de 'data'
    queryKey: ['favoritos', 'ids'],
    queryFn: getFavoritosIds,
    
    // (Opcional pero muy recomendado)
    // Transforma el array [1, 5, 23] en un Set {1, 5, 23}
    // Esto permite hacer `data.has(producto.id)` en la UI,
    // lo cual es mucho más rápido que `data.includes(producto.id)`.
    select: (data) => new Set(data),
  });
};