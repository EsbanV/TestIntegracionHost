import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../Marketplace.Types/ProductInterfaces';

// URL Base del backend
const API_URL = import.meta.env.VITE_API_URL;

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