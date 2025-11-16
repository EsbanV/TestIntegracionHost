import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ShoppingBag, ArrowRight, Loader2, X, MessageCircle 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Imports Externos ---
import { useAuth } from '@/app/context/AuthContext';
import { formatCLP } from '@/features/marketplace/Marketplace.Utils/format';
import type { Post } from '@/features/marketplace/Marketplace.Types/ProductInterfaces';

// Reutilizamos el Modal de Detalle del Marketplace si lo tienes exportado,
// si no, este archivo incluye una versión simplificada para funcionar autónomamente.
import { ProductDetailModal } from '@/features/marketplace/Marketplace.UI/MarketplacePage';

// --- Configuración ---
const API_URL = import.meta.env.VITE_API_URL;

// --- Utilidades UI ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none", className)}>
    {children}
  </span>
);

// --- TARJETA DE FAVORITO (Optimizada para esta vista) ---
const FavoriteCard = ({ 
  item, 
  onRemove, 
  onClick 
}: { 
  item: any, 
  onRemove: (id: number) => void, 
  onClick: (post: Post) => void 
}) => {
  const product = item.producto; // El backend devuelve { id: favId, producto: { ... } }
  const image = product.imagenes?.[0]?.url || product.imagenes?.[0]?.urlImagen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(product)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-lg cursor-pointer"
    >
      {/* Botón Eliminar (X) */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-500"
        title="Quitar de favoritos"
      >
        <X size={16} />
      </button>

      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img 
            src={image} 
            alt={product.nombre} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ShoppingBag size={40} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-white/90 text-slate-900 shadow-sm backdrop-blur-md border-none">
            {formatCLP(Number(product.precioActual))}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
           <h3 className="font-bold text-slate-900 line-clamp-1 text-base">{product.nombre}</h3>
           <p className="text-xs text-slate-500 mt-1 line-clamp-1">{product.descripcion || "Sin descripción"}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className={cn(
                "h-2 w-2 rounded-full",
                product.cantidad > 0 ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-xs font-medium text-slate-600">
                {product.cantidad > 0 ? "Disponible" : "Agotado"}
              </span>
           </div>
           <span className="text-xs text-blue-600 font-semibold group-hover:underline">Ver detalle</span>
        </div>
      </div>
    </motion.div>
  );
};

// --- PÁGINA PRINCIPAL DE FAVORITOS ---
export default function FavoritesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 1. Cargar Favoritos
  useEffect(() => {
    if (!token) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/api/favorites?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.ok) {
          setFavorites(data.favorites);
        }
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  // 2. Eliminar Favorito (Optimista)
  const handleRemoveFavorite = async (productId: number) => {
    // Guardar estado anterior por si falla
    const prevFavorites = [...favorites];
    
    // Actualizar UI inmediatamente
    setFavorites(prev => prev.filter(fav => fav.producto.id !== productId));

    try {
      const res = await fetch(`${API_URL}/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Error al eliminar");
      
    } catch (error) {
      console.error(error);
      // Revertir cambio si hubo error
      setFavorites(prevFavorites);
    }
  };

  const handleContact = (post: Post) => {
    navigate('/chats', { state: { toUser: post.vendedor } });
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="text-red-500 fill-red-500" /> Mis Favoritos
          </h1>
          <p className="text-slate-500 text-sm">
            Colección de productos que te interesan ({favorites.length})
          </p>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
          </div>
        ) : favorites.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={32} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes favoritos</h2>
            <p className="text-slate-500 max-w-xs mx-auto mb-8">
              Guarda los productos que te gusten para verlos aquí más tarde.
            </p>
            <button 
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Explorar Marketplace <ArrowRight size={18} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {favorites.map((fav) => (
                <FavoriteCard 
                  key={fav.id} // Usamos el ID de la relación favorito, no del producto
                  item={fav} 
                  onRemove={handleRemoveFavorite}
                  onClick={setSelectedPost}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Reutilizamos el Modal del Marketplace */}
      {/* Nota: Si no exportaste ProductDetailModal en MarketplacePage, 
          necesitarás copiarlo aquí o exportarlo desde allá. 
          Asumo que se puede importar o copiar el componente. */}
      <ProductDetailModal 
        open={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost}
        onContact={handleContact}
      />
    </div>
  );
}