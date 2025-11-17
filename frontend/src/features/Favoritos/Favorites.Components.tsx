import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, ShoppingBag, Star, ArrowRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Importamos utilidades de formato desde el hook (o un archivo utils compartido)
import { formatCLP, formatDate, getInitials } from './favorites.hooks';
import type { Post } from './favorites.types';

// --- BOTÓN DE FAVORITO ---
export const FavoriteButton = ({ isFavorite, onClick }: { isFavorite: boolean, onClick: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`
      group relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 shadow-sm
      ${isFavorite ? "bg-red-50 text-red-500 ring-1 ring-red-100" : "bg-white/90 text-slate-400 hover:text-red-400"}
    `}
    title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
  >
    <Heart 
      className={`h-5 w-5 transition-all ${isFavorite ? "fill-red-500 scale-110 text-red-500" : "text-current"}`} 
      strokeWidth={2}
    />
  </button>
);

// --- TARJETA DE FAVORITO ---
interface FavoriteItemCardProps {
  post: Post;
  onClick: (p: Post) => void;
  onRemove: (id: number) => void;
}

export const FavoriteItemCard = ({ post, onClick, onRemove }: FavoriteItemCardProps) => {
  const image = post.imagenes?.[0]?.url || "/img/placeholder-product.png";

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => onClick(post)} 
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    >
      {/* Imagen y Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img 
          src={image} 
          alt={post.nombre} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
          loading="lazy" 
        />
        
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur text-slate-800 shadow-sm border-transparent">
            {post.categoria || "Varios"}
          </Badge>
        </div>
        
        <div className="absolute top-3 right-3 z-10">
           <FavoriteButton isFavorite={true} onClick={() => onRemove(post.id)} />
        </div>
        
        <div className="absolute bottom-3 right-3">
          <Badge className="bg-emerald-600 text-white font-bold shadow-sm border-transparent">
            {formatCLP(post.precioActual || 0)}
          </Badge>
        </div>
      </div>

      {/* Información */}
      <div className="flex flex-1 flex-col p-5">
        {/* Vendedor */}
        <div className="flex items-center gap-2 mb-2">
           <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden border border-slate-200">
             {post.vendedor?.fotoPerfilUrl ? (
               <img src={post.vendedor.fotoPerfilUrl} className="w-full h-full object-cover" alt="avatar"/>
             ) : (
               getInitials(post.vendedor?.nombre)
             )}
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700">{post.vendedor?.nombre}</span>
              <span className="text-[10px] text-slate-400 leading-none">{formatDate(post.fechaAgregado)}</span>
           </div>
        </div>

        <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 text-base">{post.nombre}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{post.descripcion || "Sin descripción."}</p>
        
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
           <div className="flex items-center gap-1 text-slate-400">
             <Star size={14} className="fill-slate-200 text-slate-200" />
             <span className="text-xs font-medium">5.0</span>
           </div>
           <Button variant="outline" size="sm" className="h-8 text-xs">Ver detalle</Button>
        </div>
      </div>
    </motion.div>
  );
};

// --- ESTADO VACÍO ---
export const EmptyFavoritesState = ({ onExplore }: { onExplore: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
      <Heart size={32} className="text-slate-300" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes favoritos</h2>
    <p className="text-slate-500 max-w-xs mx-auto mb-8">Guarda productos para verlos aquí.</p>
    <button 
      onClick={onExplore} 
      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
    >
      Explorar Marketplace <ArrowRight size={18} />
    </button>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <Loader2 className="animate-spin text-slate-400 h-8 w-8" />
  </div>
);