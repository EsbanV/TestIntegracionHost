import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

// Magic UI
import { MagicCard } from '@/components/ui/magic-card';
import { RetroGrid } from '@/components/ui/retro-grid';

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
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasNextPage, fetchNextPage]
  );

  // --- ACCIONES ---
  const handleContact = async (post: Post) => {
    const result = await startTransaction(post.id);

    if (result?.ok || result?.message?.includes('autocomprarte')) {
      navigate('/chats', {
        state: {
          toUser: post.vendedor,
          transactionId: result?.transactionId,
        },
      });
      setSelectedPost(null);
    } else {
      alert(
        'No se pudo iniciar el contacto: ' +
          (result?.message || 'Error desconocido')
      );
    }
  };

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Fondo animado sutil detrás del contenido */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <RetroGrid />
      </div>

      {/* Contenedor scrollable principal */}
      <div className="relative z-10 w-full h-full p-4 md:p-8 overflow-y-auto scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          {/* Header con Buscador (ya usando Magic UI internamente) */}
          <SearchFiltersBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            totalPosts={posts.length}
            isLoading={isLoading}
          />

          {/* Listado envuelto en MagicCard para darle look de “panel” principal */}
          <MagicCard
            gradientFrom="#2563eb"
            gradientTo="#22c55e"
            gradientColor="#0f172a"
            gradientOpacity={0.16}
            gradientSize={420}
            className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-md"
          >
            <div className="p-3 md:p-4">
              {isLoading && posts.length === 0 ? (
                <LoadingSpinner />
              ) : isError ? (
                <div className="text-center py-10 text-red-500 text-sm font-medium">
                  Error al cargar datos. Intenta recargar.
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">
                  No se encontraron publicaciones.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

              {/* Spinner de carga inferior para scroll infinito */}
              {isLoading && posts.length > 0 && <LoadingSpinner />}
            </div>
          </MagicCard>
        </div>
      </div>

      {/* Modal de detalle (ya con WarpBackground y Magic UI dentro) */}
      <ProductDetailModal
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        isFavorite={favoriteIds.has(selectedPost?.id || 0)}
        onToggleFavorite={toggleFavorite}
        onContact={handleContact}
      />
    </motion.div>
  );
}
