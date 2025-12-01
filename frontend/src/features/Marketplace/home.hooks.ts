import { useCallback } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import { forumKeys } from "@/features/Forum/forum.keys"; // Reutilizamos claves
import type { Post } from "./home.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// ============================================================================
// 0. UTILS
// ============================================================================

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

async function fetchWithAuth<T>(url: string, token: string | null, options: RequestInit = {}): Promise<T> {
  if (!token) throw new Error("No autenticado");
  const res = await fetch(`${URL_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error en la petición");
  return data as T;
}

// ============================================================================
// 1. HOOKS DE DATOS (Marketplace Feed)
// ============================================================================

export const usePosts = (searchTerm: string, categoryId: string) => {
  const { token } = useAuth();

  return useInfiniteQuery({
    // Clave compuesta para que el feed se resetee al cambiar filtros
    queryKey: [...forumKeys.publications(), searchTerm, categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryId && { category: categoryId })
      });

      // Fetch público o privado según token (para ver si ya le di like, etc.)
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${URL_BASE}/api/products?${params.toString()}`, { headers });
      
      if (!res.ok) throw new Error('Error fetching posts');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
       if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1;
       }
       return undefined;
    },
    // Transformación de datos para la UI
    select: (data) => ({
       posts: data.pages.flatMap((page: any) => 
          page.products.map((p: any) => ({
             id: p.id,
             nombre: p.nombre,
             descripcion: p.descripcion,
             precioActual: p.precioActual,
             cantidad: p.cantidad,
             categoria: p.categoria,
             estado: p.estado,
             fechaAgregado: p.fechaAgregado,
             vendedor: {
                id: p.vendedor.id,
                nombre: p.vendedor.nombre,
                usuario: p.vendedor.usuario,
                fotoPerfilUrl: p.vendedor.fotoPerfilUrl,
                campus: p.vendedor.campus,
                reputacion: p.vendedor.reputacion
             },
             imagenes: p.imagenes?.map((img: any) => ({
                id: img.id,
                url: img.urlImagen || img.url
             })) || []
          }))
       ) as Post[]
    })
  });
};

// ============================================================================
// 2. GESTIÓN DE FAVORITOS
// ============================================================================

export const useFavorites = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // Cache de IDs de favoritos
  const { data: favoriteIds = new Set<number>() } = useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: async () => {
       if (!token) return new Set<number>();
       const res = await fetch(`${URL_BASE}/api/favorites?limit=100`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
       });
       const data = await res.json();
       if (data.ok) return new Set<number>(data.favorites.map((fav: any) => fav.productoId));
       return new Set<number>();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5 // 5 min
  });

  // Toggle Favorito
  const toggleMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!token) throw new Error("No autenticado");
      
      const isFav = favoriteIds.has(productId);
      const method = isFav ? 'DELETE' : 'POST';
      const url = isFav ? `${URL_BASE}/api/favorites/${productId}` : `${URL_BASE}/api/favorites`;
      
      const res = await fetch(url, { 
         method, 
         headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
         }, 
         body: isFav ? undefined : JSON.stringify({ productoId: productId }) 
      });
      
      if (!res.ok) throw new Error("Error al actualizar favorito");
      return { productId, added: !isFav };
    },
    // Optimistic Update o Invalidation
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  return { 
     favoriteIds, 
     toggleFavorite: toggleMutation.mutate 
  };
};

// ============================================================================
// 3. CONTACTO (Iniciar Transacción)
// ============================================================================

export function useContactSeller() {
  const { token } = useAuth();

  const startTransaction = useCallback(
    async (productId: number, _sellerId: number) => {
      if (!token) return { ok: false, created: false, transactionId: 0, message: "No autenticado" };

      try {
        const data = await fetchWithAuth<{
          ok: boolean; created: boolean; id?: number; transactionId?: number; message?: string;
        }>("/api/transactions", token, {
          method: "POST",
          body: JSON.stringify({ productId, quantity: 1 }),
        });

        const txId = data.transactionId ?? data.id ?? 0;
        return { ok: data.ok, created: data.created, transactionId: txId, message: data.message };
      } catch (err: any) {
        console.error(err);
        return { ok: false, created: false, transactionId: 0, message: err?.message || "Error al iniciar compra" };
      }
    },
    [token]
  );

  const sendMessage = useCallback(
    async (toUserId: number, content: string): Promise<boolean> => {
      if (!token || !content.trim()) return false;
      try {
        const data = await fetchWithAuth<{ ok: boolean }>("/api/chat/send", token, {
            method: "POST",
            body: JSON.stringify({ destinatarioId: toUserId, contenido: content, tipo: "texto" }),
          }
        );
        return !!data.ok;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [token]
  );

  return { startTransaction, sendMessage };
}