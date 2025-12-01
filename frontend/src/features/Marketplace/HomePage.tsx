import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, AlertCircle, Search } from 'lucide-react'; 

// Hooks (Lógica)
import {
  usePosts,
  useFavorites,
  useContactSeller,
} from '@/features/Marketplace/home.hooks';

import type { Post } from '@/features/Marketplace/home.types';

// Componentes Visuales (UI)
import {
  ItemCard,
  ProductDetailModal,
  LoadingSpinner,
  SearchFiltersBar,
  Button
} from '@/features/Marketplace/Home.Components';

export default function HomePage() {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // --- CONFIGURACIÓN ---
  const categories = useMemo(
    () => ['Electrónica', 'Libros y Apuntes', 'Servicios', 'Ropa', 'Otros'],
    []
  );
  
  const categoryMap: Record<string, string> = {
    Electrónica: 'Electrónica',
    'Libros y Apuntes': 'Libros y Apuntes',
    Servicios: 'Servicios',
    Ropa: 'Ropa',
    Otros: 'Otros',
  };
  
  const selectedCategoryId = selectedCategory
    ? categoryMap[selectedCategory] ?? ''
    : '';

  // --- DATOS ---
  const { data, fetchNextPage, hasNextPage, isLoading, isError, refetch } = usePosts(
    searchTerm,
    selectedCategoryId
  );
  const posts = data?.posts || [];

  const { favoriteIds, toggleFavorite } = useFavorites();
  const { startTransaction } = useContactSeller();

  // --- SCROLL INFINITO ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasNextPage, fetchNextPage]
  );

  // --- ACCIONES ---
  const handleContact = async (post: Post) => {
    const result = await startTransaction(post.id, post.vendedor.id);

    if (!result?.ok) {
      alert(result.message || 'No se pudo iniciar la compra');
      return;
    }

    if (!result.created) {
      console.log('Retomando transacción existente', result.transactionId);
    }

    navigate('/chats', {
      state: {
        toUser: post.vendedor,
        transactionId: result.transactionId,
      },
    });

    setSelectedPost(null);
  };

  return (
    // Mantenemos el fondo transparente para que se vea el patrón de puntos del body
    <div className="w-full min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24">
        
        {/* Header Flotante con Buscador */}
        <SearchFiltersBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          totalPosts={posts.length}
          isLoading={isLoading}
        />

        {/* --- CONTENIDO PRINCIPAL --- */}
        
        {/* 1. Estado de Error (Semántico: Destructive) */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-destructive/10 p-4 rounded-full mb-4 border border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Algo salió mal</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
              No pudimos cargar las publicaciones. Por favor, verifica tu conexión.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Intentar de nuevo
            </Button>
          </div>
        )}

        {/* 2. Estado Vacío (Semántico: Muted/Foreground) */}
        {!isLoading && !isError && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-muted p-6 rounded-full mb-4 shadow-inner">
              {searchTerm ? (
                <Search className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Ghost className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {searchTerm ? "Sin resultados" : "No hay publicaciones"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              {searchTerm 
                ? `No encontramos nada relacionado con "${searchTerm}". Intenta con otra palabra clave.`
                : "Parece que aún no hay productos en esta categoría. ¡Sé el primero en publicar!"}
            </p>
            {searchTerm && (
               <Button variant="ghost" className="mt-4 text-primary hover:text-primary/80" onClick={() => setSearchTerm('')}>
                 Limpiar búsqueda
               </Button>
            )}
          </div>
        )}

        {/* 3. Grid de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post, i) => (
            <div
              key={post.id}
              ref={i === posts.length - 1 ? lastPostRef : null}
              className="h-full" 
            >
              <ItemCard
                post={post}
                onClick={setSelectedPost}
                isFavorite={favoriteIds.has(post.id)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>

        {/* 4. Spinner Inferior */}
        {isLoading && (
          <div className="py-8 w-full">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      <ProductDetailModal
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        isFavorite={favoriteIds.has(selectedPost?.id || 0)}
        onToggleFavorite={toggleFavorite}
        onContact={handleContact}
      />
    </div>
  );
}