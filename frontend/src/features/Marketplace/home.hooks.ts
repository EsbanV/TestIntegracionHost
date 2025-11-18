import { useState, useEffect, useMemo, useCallback } from "react";
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { Post, StartTransactionApiResponse } from "./home.types";

// URL Base del backend
const API_URL = import.meta.env.VITE_API_URL;
const URL_BASE = import.meta.env.VITE_API_URL;


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

export async function fetchWithAuth<T>(
  url: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  if (!token) {
    throw new Error("No autenticado");
  }

  const res = await fetch(`${URL_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const rawData: any = await res.json();

  if (!res.ok) {
    // si el backend manda { message: string }, lo aprovechamos
    throw new Error(rawData?.message || "Error en la petición");
  }

  // aquí ya es “éxito”, casteamos a T
  return rawData as T;
}



// --- HOOKS DE DATOS ---

// 1. Obtener Posts (Paginado + Filtros)
export const usePosts = (searchTerm: string, categoryId: string) => {
  const { token } = useAuth();

  return useInfiniteQuery({
    queryKey: ['marketplace-posts', searchTerm, categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryId && { category: categoryId })
      });

      const res = await fetch(`${API_URL}/api/products?${params.toString()}`, {
         // Headers opcionales si tu API pública requiere token, sino quitar
         headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
      });
      
      if (!res.ok) throw new Error('Error fetching posts');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
       // Asumiendo que tu API devuelve { pagination: { totalPages, page } }
       if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1;
       }
       return undefined;
    },
    // Aplanar datos para fácil consumo
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
             // Mapear vendedor y sus datos
             vendedor: {
                id: p.vendedor.id,
                nombre: p.vendedor.nombre,
                usuario: p.vendedor.usuario, // Este es el dato clave
                fotoPerfilUrl: p.vendedor.fotoPerfilUrl, // Ahora sí vendrá lleno
                campus: p.vendedor.campus,
                reputacion: p.vendedor.reputacion
             },
             // Mapear imágenes (normalizar URL)
             imagenes: p.imagenes?.map((img: any) => ({
                id: img.id,
                url: img.urlImagen || img.url // Ajustar según tu API
             })) || []
          }))
       ) as Post[]
    })
  });
};

// 2. Gestión de Favoritos
export const useFavorites = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // Cargar favoritos iniciales
  const { data: favorites = new Set<number>() } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
       if (!token) return new Set<number>();
       const res = await fetch(`${API_URL}/api/favorites?limit=100`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
       });
       const data = await res.json();
       if (data.ok) return new Set<number>(data.favorites.map((fav: any) => fav.productoId));
       return new Set<number>();
    },
    enabled: !!token
  });

  // Mutación para togglear
  const toggleMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!token) throw new Error("No autenticado");
      
      const isFav = favorites.has(productId);
      const method = isFav ? 'DELETE' : 'POST';
      const url = isFav ? `${API_URL}/api/favorites/${productId}` : `${API_URL}/api/favorites`;
      
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
    // Actualización optimista o invalidación
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  return { 
     favoriteIds: favorites, 
     toggleFavorite: toggleMutation.mutate 
  };
};

// 3. Hook de Contacto (Iniciar Transacción)
export const useContactSeller = () => {
  const { token } = useAuth();

  const startTransaction = useCallback(
    async (productId: number, quantity = 1) => {
      if (!token) {
        return { ok: false, message: 'No autenticado' };
      }

      try {
        // 👇 Aquí le pasamos el tipo al genérico <StartTransactionApiResponse>
        const data = await fetchWithAuth<StartTransactionApiResponse>(
          '/api/transactions',
          token,
          {
            method: 'POST',
            body: JSON.stringify({ productId, quantity }),
          }
        );

        // Si la petición HTTP fallara, fetchWithAuth ya habría hecho throw,
        // así que si llegas aquí es un caso "ok" a nivel HTTP.
        return {
          ok: true,
          created: data.created,
          transactionId: data.transactionId,
          message: data.message,
        };
      } catch (error: any) {
        // Errores HTTP (400, 500, etc.) o de red
        return {
          ok: false,
          message: error?.message || 'Error al iniciar compra',
        };
      }
    },
    [token]
  );

  // Si también quieres usar fetchWithAuth en sendMessage:
  // (opcional: si te gusta más, puedes dejarlo con fetch normal)
  const sendMessage = useCallback(
    async (destinatarioId: number, contenido: string) => {
      if (!token) return false;

      interface SendMessageResponse {
        ok: boolean;
        message?: string;
      }

      try {
        const data = await fetchWithAuth<SendMessageResponse>(
          '/api/chat/send',
          token,
          {
            method: 'POST',
            body: JSON.stringify({ destinatarioId, contenido, tipo: 'texto' }),
          }
        );

        return data.ok;
      } catch {
        return false;
      }
    },
    [token]
  );

  return { startTransaction, sendMessage };
};



interface UsePostsOptions {
  searchTerm: string;
  categoryId: string;
}

export function usePostsWithFilters({ searchTerm, categoryId }: UsePostsOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Estado de paginación
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Reiniciar lista cuando cambian los filtros
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasNextPage(true);
    fetchData(1, true); // true = es una nueva búsqueda
  }, [searchTerm, categoryId]);

  const fetchData = async (pageNum: number, isNewSearch: boolean = false) => {
    try {
      if (isNewSearch) setIsLoading(true);
      else setIsFetchingNextPage(true);
      setIsError(false);

      // Construir Query Params
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '12'); // Traer 12 productos por carga
      if (searchTerm) params.append('search', searchTerm);
      if (categoryId) params.append('category', categoryId);

      const response = await fetch(`${API_URL}/api/products?${params.toString()}`);
      
      if (!response.ok) throw new Error('Error al cargar productos');

      const data = await response.json();

      if (data.ok) {
        // Mapear datos del backend al formato de tu Frontend
        const newPosts: Post[] = data.products.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioActual: p.precioActual,
          cantidad: p.cantidad,
          categoria: p.categoria,
          estado: p.estado, // 'Disponible', etc.
          fechaAgregado: p.fechaAgregado,
          vendedor: {
            id: p.vendedor.id,
            usuario: p.vendedor.usuario,
            nombre: p.vendedor.nombre,
            fotoPerfilUrl: p.vendedor.fotoPerfilUrl, // Asegúrate que el backend mande esto si existe
            reputacion: p.vendedor.reputacion,
            campus: p.vendedor.campus
          },
          // Mapeo crítico: Backend envía 'urlImagen', UI espera 'url'
          imagenes: p.imagenes.map((img: any) => ({
            id: img.id,
            url: img.urlImagen // <--- AQUÍ HACEMOS LA CONEXIÓN
          }))
        }));

        setPosts(prev => isNewSearch ? newPosts : [...prev, ...newPosts]);
        
        // Verificar si quedan más páginas
        const totalPages = data.pagination.totalPages;
        setHasNextPage(pageNum < totalPages);
      }

    } catch (err) {
      console.error(err);
      setIsError(true);
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  };

  const fetchNextPage = useCallback(() => {
    if (!isLoading && !isFetchingNextPage && hasNextPage) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  }, [page, isLoading, isFetchingNextPage, hasNextPage]);

  return {
    posts,
    hasNextPage,
    fetchNextPage,
    isLoading, // Carga inicial
    isFetchingNextPage, // Carga de scroll infinito
    isError,
    error
  };
}