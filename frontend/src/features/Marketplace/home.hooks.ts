import { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import API from "@/api/axiosInstance"; // <--- Importamos tu instancia
import type { Post } from "./home.types";

// --- UTILS (Solo dejamos los de formato, eliminamos fetchWithAuth) ---
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

// --- HOOKS DE DATOS ---

// 1. Obtener Posts (Infinite Query)
export const usePosts = (searchTerm: string, categoryId: string) => {
  
  return useInfiniteQuery({
    queryKey: ['marketplace-posts', searchTerm, categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await API.get('/products', {
        params: {
          page: pageParam,
          limit: 12,
          search: searchTerm || undefined,
          category: categoryId || undefined
        }
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
       if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1;
       }
       return undefined;
    },
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
                ...p.vendedor,
                fotoPerfilUrl: p.vendedor.fotoPerfilUrl 
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

// 2. Gestión de Favoritos
export const useFavorites = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: favorites = new Set<number>() } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
       const { data } = await API.get('/favorites', { params: { limit: 100 } });
       if (data.ok) return new Set<number>(data.favorites.map((fav: any) => fav.productoId));
       return new Set<number>();
    },
    enabled: !!token
  });

  const toggleMutation = useMutation({
    mutationFn: async (productId: number) => {
      const isFav = favorites.has(productId);
      
      if (isFav) {
        await API.delete(`/favorites/${productId}`);
      } else {
        await API.post('/favorites', { productoId: productId });
      }
      
      return { productId, added: !isFav };
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  return { 
     favoriteIds: favorites, 
     toggleFavorite: toggleMutation.mutate 
  };
};

// 3. Hook de Contacto y Transacción
type StartTransactionResult = {
  ok: boolean;
  created: boolean;
  transactionId: number;
  message?: string;
};

export function useContactSeller() {
  const { token } = useAuth();

  const startTransaction = useCallback(
    async (productId: number, _sellerId: number): Promise<StartTransactionResult> => {
      if (!token) return { ok: false, created: false, transactionId: 0, message: "No autenticado" };

      try {
        const { data } = await API.post("/transactions", {
            productId,
            quantity: 1,
        });

        return {
          ok: data.ok,
          created: data.created,
          transactionId: data.transactionId ?? data.id ?? 0,
          message: data.message,
        };
      } catch (err: any) {
        console.error("Error al iniciar transacción:", err);
        const msg = err.response?.data?.message || err.message || "Error al iniciar la compra";
        return { ok: false, created: false, transactionId: 0, message: msg };
      }
    },
    [token]
  );

  const sendMessage = useCallback(
    async (toUserId: number, content: string): Promise<boolean> => {
      if (!token || !content.trim()) return false;

      try {
        const { data } = await API.post("/chat/send", {
            destinatarioId: toUserId,
            contenido: content,
            tipo: "texto",
        });
        return !!data.ok;
      } catch (err) {
        console.error("Error al enviar mensaje:", err);
        return false;
      }
    },
    [token]
  );

  return { startTransaction, sendMessage };
}

interface UsePostsOptions {
  searchTerm: string;
  categoryId: string;
}

export function usePostsWithFilters({ searchTerm, categoryId }: UsePostsOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasNextPage(true);
    fetchData(1, true);
  }, [searchTerm, categoryId]);

  const fetchData = async (pageNum: number, isNewSearch: boolean = false) => {
    try {
      if (isNewSearch) setIsLoading(true);
      else setIsFetchingNextPage(true);
      setIsError(false);

      const { data } = await API.get('/products', {
          params: {
              page: pageNum,
              limit: 12,
              search: searchTerm || undefined,
              category: categoryId || undefined
          }
      });

      if (data.ok) {
        const newPosts: Post[] = data.products.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioActual: p.precioActual,
          cantidad: p.cantidad,
          categoria: p.categoria,
          estado: p.estado,
          fechaAgregado: p.fechaAgregado,
          vendedor: {
            ...p.vendedor,
            fotoPerfilUrl: p.vendedor.fotoPerfilUrl,
          },
          imagenes: p.imagenes.map((img: any) => ({
            id: img.id,
            url: img.urlImagen
          }))
        }));

        setPosts(prev => isNewSearch ? newPosts : [...prev, ...newPosts]);
        setHasNextPage(pageNum < data.pagination.totalPages);
      }

    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setError(err);
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
    isLoading,
    isFetchingNextPage,
    isError,
    error
  };
}