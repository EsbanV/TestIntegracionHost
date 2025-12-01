import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const { data, fetchNextPage, hasNextPage, isLoading, isError } = usePosts(
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
    <div className="w-full h-full px-3 pt-2 pb-4 sm:px-4 sm:pt-4 md:p-8 overflow-y-auto scroll-smooth bg-background">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16 md:pb-20">
        {/* Header con Buscador */}
        <SearchFiltersBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          totalPosts={posts.length}
          isLoading={isLoading}
        />

        {/* Contenido */}
        {isLoading && posts.length === 0 ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="text-center py-10 text-destructive font-medium">
            Error al cargar datos. Intenta recargar.
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-muted-foreground text-sm flex flex-col items-center gap-2">
            <span>No se encontraron publicaciones.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {posts.map((post, i) => (
              <div
                key={post.id}
                ref={i === posts.length - 1 ? lastPostRef : null}
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
        )}

        {/* Spinner de carga inferior */}
        {isLoading && posts.length > 0 && <LoadingSpinner />}
      </div>

      {/* Modal */}
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