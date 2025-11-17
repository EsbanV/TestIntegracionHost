import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search } from 'lucide-react';

// Hooks
import { useFavoritesList } from '@/features/Favoritos/favorites.hooks';
import { useContactSeller } from '@/features/Marketplace/home.hooks'; // Reutilizamos el hook de contacto existente

// Componentes
import { 
  FavoriteItemCard, 
  EmptyFavoritesState, 
  LoadingSpinner 
} from '@/features/Favoritos/Favorites.Components';
import { ProductDetailModal } from '@/features/Marketplace/Home.Components'; // Reutilizamos el modal del home

import type { Post } from '@/features/Favoritos/favorites.types';

export default function FavoritesPage() {
  const navigate = useNavigate();
  
  // 1. Datos de Favoritos
  const { 
    posts, 
    isLoading, 
    searchTerm, 
    setSearchTerm, 
    removeFavorite 
  } = useFavoritesList();

  // 2. Lógica de Contacto (Reutilizada del Marketplace)
  const { startTransaction } = useContactSeller();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleContact = async (post: any) => {
    const result = await startTransaction(post.id);
    if (result?.ok || result?.message?.includes('autocomprarte')) {
        navigate('/chats', { 
          state: { 
              toUser: post.vendedor,
              transactionId: result?.transactionId 
          } 
        });
        setSelectedPost(null);
    } else {
        alert("No se pudo iniciar el contacto: " + (result?.message || "Error desconocido"));
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto scroll-smooth bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Heart className="text-red-500 fill-red-500" /> Mis Favoritos
             </h1>
             <p className="text-slate-500 text-sm">
               Productos que te han gustado ({posts.length})
             </p>
          </div>
          
          <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar en favoritos..." 
               className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all bg-white" 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)} 
             />
          </div>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <LoadingSpinner />
        ) : posts.length === 0 ? (
          <EmptyFavoritesState onExplore={() => navigate('/home')} />
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {posts.map((post) => (
                <FavoriteItemCard 
                  key={post.id} 
                  post={post} 
                  onClick={setSelectedPost} 
                  onRemove={removeFavorite} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal de Detalle (Reutilizado) */}
      {/* Nota: isFavorite siempre true aquí porque estamos en favoritos */}
      <ProductDetailModal 
        open={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost as any} 
        isFavorite={true} 
        onToggleFavorite={() => selectedPost && removeFavorite(selectedPost.id)}
        onContact={handleContact}
      />
    </div>
  );
}