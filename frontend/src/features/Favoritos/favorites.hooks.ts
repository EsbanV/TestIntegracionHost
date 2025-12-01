import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { forumKeys } from '../Forum/forum.keys'; // Podemos reutilizar las keys del foro o crear nuevas si prefieres
import type { Post } from './favorites.types';

const API_URL = import.meta.env.VITE_API_URL;

// --- UTILS ---
export const formatCLP = (amount: number) => {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
};

export const formatDate = (d?: string | number | Date | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-CL", { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  } catch { return ""; }
};

export const getInitials = (name?: string) => {
  if (!name) return "U";
  return name.substring(0, 2).toUpperCase();
};

// --- KEYS ---
// Si decides separar las keys, podrías mover esto a favorites.keys.ts
const favoritesKeys = {
  all: ['favorites'] as const,
  list: () => [...favoritesKeys.all, 'list'] as const,
};

// --- HOOK PRINCIPAL ---

export const useFavoritesList = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // 1. LECTURA (Query)
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: favoritesKeys.list(),
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/favorites?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!data.ok) throw new Error("Error cargando favoritos");

      // Mapeo de datos para limpiar la estructura
      return data.favorites.map((fav: any) => {
         const p = fav.producto;
         return {
           id: p.id,
           nombre: p.nombre,
           descripcion: p.descripcion,
           precioActual: Number(p.precioActual),
           cantidad: p.cantidad,
           categoria: p.categoria?.nombre,
           estado: p.estado?.nombre,
           fechaAgregado: p.fechaAgregado,
           vendedor: p.vendedor,
           imagenes: p.imagenes?.map((img: any) => ({ 
             id: img.id, 
             url: img.urlImagen || img.url 
           })) || []
         };
      }) as Post[];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  // 2. ELIMINAR (Mutation)
  const removeMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`${API_URL}/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al eliminar favorito");
      return res.json();
    },
    onMutate: async (productId) => {
      // Optimistic Update: Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: favoritesKeys.list() });

      // Guardar estado anterior
      const previousFavorites = queryClient.getQueryData<Post[]>(favoritesKeys.list());

      // Actualizar caché visualmente
      if (previousFavorites) {
        queryClient.setQueryData<Post[]>(
          favoritesKeys.list(), 
          previousFavorites.filter(p => p.id !== productId)
        );
      }

      return { previousFavorites };
    },
    onError: (_err, _productId, context) => {
      // Revertir si falla
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesKeys.list(), context.previousFavorites);
      }
    },
    onSettled: () => {
      // Sincronizar con servidor al terminar
      queryClient.invalidateQueries({ queryKey: favoritesKeys.list() });
      // Opcional: También invalidar la lista del home si muestras iconos de corazón ahí
      queryClient.invalidateQueries({ queryKey: forumKeys.publications() }); 
    }
  });

  // Filtrado local en memoria
  const filteredPosts = useMemo(() => {
    if (!searchTerm) return posts;
    return posts.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  return {
    posts: filteredPosts,
    totalCount: posts.length,
    isLoading,
    isError,
    searchTerm,
    setSearchTerm,
    removeFavorite: removeMutation.mutate
  };
};