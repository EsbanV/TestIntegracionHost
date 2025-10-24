import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type ToggleFavoritoPayload = {
  productoId: number;
};

// La función de mutación
const toggleFavorito = async (payload: ToggleFavoritoPayload): Promise<unknown> => {
  return api.post('/api/favoritos/toggle', payload);
};

/**
 * Hook de mutación para añadir/quitar un producto de favoritos.
 */
export const useToggleFavorito = () => {
  // Obtenemos el cliente de query para invalidar el caché
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, ToggleFavoritoPayload>({
    mutationFn: toggleFavorito,
    
    // (Crucial)
    // Cuando la mutación (el POST) es exitosa...
    onSuccess: () => {
      // ...le decimos a React Query que el caché de ['favoritos', 'ids'] está obsoleto.
      // Esto forzará al hook 'useMisFavoritosIds' a volver a pedir los datos.
      // El icono del corazón se actualizará automáticamente.
      queryClient.invalidateQueries({ queryKey: ['favoritos', 'ids'] });
    },
    
    // (Opcional) Puedes añadir manejo de onError
    // onError: (error) => {
    //   console.error(error);
    //   // Mostrar un toast/notificación de error
    // }
  });
};