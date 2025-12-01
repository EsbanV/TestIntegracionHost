import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, ShoppingBag, Star, ArrowRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { formatCLP, formatDate, getInitials } from './favorites.hooks';
import type { Post } from './favorites.types';

// --- BOTÓN DE FAVORITO ---
export const FavoriteButton = ({ isFavorite, onClick }: { isFavorite: boolean, onClick: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`
      group relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 shadow-sm
      ${isFavorite 
        ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20" 
        : "bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-card border border-border/50"}
    `}
    title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
  >
    <Heart 
      className={`h-5 w-5 transition-all ${isFavorite ? "fill-destructive scale-110 text-destructive" : "text-current"}`} 
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
  const image = post.imagenes?.[0]?.url;

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => onClick(post)} 
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer"
    >
      {/* Imagen y Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <img 
            src={image} 
            alt={post.nombre} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy" 
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur text-foreground shadow-sm border-border/50">
            {post.categoria || "Varios"}
          </Badge>
        </div>
        
        <div className="absolute top-3 right-3 z-10">
           <FavoriteButton isFavorite={true} onClick={() => onRemove(post.id)} />
        </div>
        
        <div className="absolute bottom-3 right-3">
          {/* Precio con estilo Primary/Enterprise */}
          <Badge className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 border-0">
            {formatCLP(post.precioActual || 0)}
          </Badge>
        </div>
      </div>

      {/* Información */}
      <div className="flex flex-1 flex-col p-5">
        {/* Vendedor */}
        <div className="flex items-center gap-2 mb-2">
           <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 overflow-hidden border border-border">
             {post.vendedor?.fotoPerfilUrl ? (
               <img src={post.vendedor.fotoPerfilUrl} className="w-full h-full object-cover" alt="avatar"/>
             ) : (
               getInitials(post.vendedor?.nombre)
             )}
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{post.vendedor?.nombre}</span>
              <span className="text-[10px] text-muted-foreground leading-none">{formatDate(post.fechaAgregado)}</span>
           </div>
        </div>

        <h3 className="font-bold text-card-foreground line-clamp-1 mb-1 text-base group-hover:text-primary transition-colors">
          {post.nombre}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {post.descripcion || "Sin descripción."}
        </p>
        
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
           <div className="flex items-center gap-1 text-muted-foreground">
             <Star size={14} className="fill-yellow-400 text-yellow-400" />
             <span className="text-xs font-medium">5.0</span>
           </div>
           <Button variant="outline" size="sm" className="h-8 text-xs border-border hover:bg-muted hover:text-foreground">
             Ver detalle
           </Button>
        </div>
      </div>
    </motion.div>
  );
};

// --- ESTADO VACÍO ---
export const EmptyFavoritesState = ({ onExplore }: { onExplore: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border border-border shadow-sm text-center">
    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
      <Heart size={32} className="text-muted-foreground/50" />
    </div>
    <h2 className="text-xl font-bold text-foreground mb-2">Aún no tienes favoritos</h2>
    <p className="text-muted-foreground max-w-xs mx-auto mb-8">Guarda productos para verlos aquí.</p>
    <Button 
      onClick={onExplore} 
      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
    >
      Explorar Marketplace <ArrowRight size={18} />
    </Button>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <Loader2 className="animate-spin text-primary h-8 w-8" />
  </div>
);