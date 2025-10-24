import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Categoria } from '../Marketplace.Types/product';

const getCategorias = async (): Promise<Categoria[]> => {
  return api.get<Categoria[]>('/api/categorias');
};

/**
 * Hook para obtener la lista de todas las categorías.
 */
export const useCategorias = () => {
  return useQuery<Categoria[], Error>({
    queryKey: ['categorias'], // Clave simple, no depende de nada
    queryFn: getCategorias,
    
    // (Opcional pero recomendado)
    // Las categorías no cambian a menudo.
    // Las mantenemos "frescas" en caché por 5 minutos.
    staleTime: 1000 * 60 * 5, 
  });
};