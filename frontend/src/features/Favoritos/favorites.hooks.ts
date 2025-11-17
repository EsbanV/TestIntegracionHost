import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import type { Post } from './favorites.types';

const API_URL = import.meta.env.VITE_API_URL;

// --- UTILS --- (Si no tienes un archivo utils compartido, puedes dejarlas aquí o importar)
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

// --- HOOK PRINCIPAL ---

export const useFavoritesList = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch inicial de favoritos
  useEffect(() => {
    if (!token) return;
    
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/api/favorites?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.ok) {
          const mappedPosts: Post[] = data.favorites.map((fav: any) => {
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
               // Normalización de imágenes
               imagenes: p.imagenes?.map((img: any) => ({ 
                 id: img.id, 
                 url: img.urlImagen || img.url 
               })) || []
             };
          });
          setPosts(mappedPosts);
        }
      } catch (error) { 
        console.error("Error fetching favorites:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    
    fetchFavorites();
  }, [token]);

  // Eliminar favorito
  const removeFavorite = async (productId: number) => {
    // Optimistic update: quitar de la lista visualmente primero
    setPosts(prev => prev.filter(p => p.id !== productId));
    
    try {
      await fetch(`${API_URL}/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) { 
      console.error("Error removing favorite:", error); 
      // Aquí podrías revertir el cambio si falla, pero en favoritos no es crítico
    }
  };

  // Filtrado local por búsqueda
  const filteredPosts = useMemo(() => {
    return posts.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  return {
    posts: filteredPosts,
    totalCount: posts.length, // Total real antes de filtrar
    isLoading,
    searchTerm,
    setSearchTerm,
    removeFavorite
  };
};