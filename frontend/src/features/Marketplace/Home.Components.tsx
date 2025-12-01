import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  Search, X, ChevronLeft, ChevronRight, 
  ShoppingBag, Star, Filter, Heart, Loader2,
  Send, Check, MapPin, Tag
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '@/app/context/AuthContext';
import { useContactSeller, formatCLP, formatDate, getInitials } from './home.hooks';
import type { Post } from './home.types';

// Utilidad para combinar clases Tailwind
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 1. ÁTOMOS (Botones, Badges, Loaders)
// ============================================================================

export const Badge = ({
  children,
  className,
  variant = 'default',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  variant?: 'default'|'secondary'|'outline'|'price'|'category'|'suggestion'|'status'
  onClick?: () => void
}) => {
  const variants = {
    // Default: Primario (Indigo en el tema)
    default: "bg-primary text-primary-foreground shadow-md shadow-primary/20 border-0",
    
    // Secondary: Muted
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0",
    
    // Outline: Borde sutil
    outline: "text-muted-foreground border-border border bg-transparent",
    
    // Precio: Destacado (Usamos Chart-2 que suele ser verde/teal en temas modernos, o Primary si prefieres)
    price: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/25 tracking-wide",
    
    // Categoría: Efecto Vidrio (Glassmorphism sobre fondo card)
    category: "bg-card/90 backdrop-blur-md text-card-foreground font-semibold shadow-sm border border-border hover:bg-card transition-all hover:scale-105 cursor-pointer",
    
    // Sugerencia (Chat): Pill interactivo
    suggestion: "bg-accent/50 text-accent-foreground border border-accent hover:bg-accent cursor-pointer active:scale-95 transition-transform",
    
    // Status: Para etiquetas de estado
    status: "bg-foreground text-background text-[10px] font-bold uppercase tracking-wider",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] sm:text-xs transition-all duration-300",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'gradient'
    size?: 'default' | 'sm' | 'icon' | 'lg'
    loading?: boolean
  }
>(
  (
    { className, variant = 'default', size = 'default', loading, children, ...props },
    ref
  ) => {
    const variants = {
      // Primary: Gradiente basado en variable Primary
      default: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-0 hover:bg-primary/90 hover:-translate-y-0.5",
      
      // Secondary
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0",
      
      // Outline
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
      
      // Ghost
      ghost: "hover:bg-accent hover:text-accent-foreground",
      
      // Gradient Danger/Action (Usando Destructive)
      gradient: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:bg-destructive/90",
    };
    
    const sizes = {
      default: "h-10 px-5 py-2 text-sm",
      sm: "h-8 rounded-full px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-10 w-10 rounded-full p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      {/* Doble anillo animado */}
      <div className="h-12 w-12 rounded-full border-4 border-muted"></div>
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  </div>
);

export const FavoriteButton = ({
  isFavorite,
  onClick,
  className,
}: {
  isFavorite: boolean
  onClick: () => void
  className?: string
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 active:scale-75 z-20",
      isFavorite
        ? "bg-destructive text-destructive-foreground shadow-md shadow-destructive/30"
        : "bg-card/90 backdrop-blur-sm text-muted-foreground hover:bg-card hover:text-destructive hover:shadow-lg",
      className
    )}
  >
    <Heart
      className={cn(
        "h-5 w-5 transition-all duration-300",
        isFavorite ? "fill-current stroke-current scale-100" : "fill-transparent scale-95"
      )}
      strokeWidth={2.5}
    />
  </button>
);

// ============================================================================
// 2. IMAGE CAROUSEL
// ============================================================================

export function ImageCarousel({
  images,
  altPrefix,
  isFavorite,
  onToggleFavorite,
}: {
  images: { id: number; url: string }[] | undefined | null
  altPrefix?: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
}) {
  const [index, setIndex] = useState(0);

  const validImages = useMemo(() => {
    if (images && images.length > 0) return images;
    return [{ id: 0, url: "/assets/img/placeholder.png" }];
  }, [images]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % validImages.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="flex flex-col gap-3 relative group select-none">
      <div className="relative w-full overflow-hidden rounded-2xl bg-muted border border-border aspect-[4/3]">
        <AnimatePresence mode="wait">
          <motion.img
            key={validImages[index].id}
            src={validImages[index].url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            alt={`${altPrefix} - ${index + 1}`}
            className="h-full w-full object-cover bg-card"
          />
        </AnimatePresence>

        {/* Favorite Button (Top Right) */}
        {onToggleFavorite && (
          <div className="absolute top-3 right-3 z-20">
            <FavoriteButton
              isFavorite={!!isFavorite}
              onClick={onToggleFavorite}
            />
          </div>
        )}

        {/* Navigation Arrows (Visible on Group Hover) */}
        {validImages.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <button
                onClick={prevImage}
                className="pointer-events-auto rounded-full bg-card/80 p-2 text-card-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card hover:scale-110 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 duration-300 hover:text-primary"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <button
                onClick={nextImage}
                className="pointer-events-auto rounded-full bg-card/80 p-2 text-card-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card hover:scale-110 opacity-0 group-hover:opacity-100 translate-x-[10px] group-hover:translate-x-0 duration-300 hover:text-primary"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-foreground/20 backdrop-blur-md rounded-full border border-background/10">
              {validImages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                    i === index ? "w-5 bg-background" : "w-1.5 bg-background/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (Solo si hay más de 1 imagen) */}
      {validImages.length > 1 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {validImages.map((img, i) => (
            <button
              key={img.id}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={cn(
                "relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 h-14 w-14",
                i === index
                  ? "border-primary opacity-100 ring-2 ring-primary/20"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-muted-foreground"
              )}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. ITEM CARD (Semántica)
// ============================================================================

export const ItemCard = ({
  post,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  post: Post
  onClick: (p: Post) => void
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
}) => {
  const image = post.imagenes?.[0]?.url;

  return (
    <div
      onClick={() => onClick(post)}
      className="group relative flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5"
    >
      {/* 1. Imagen y Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* Overlay gradiente en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

        {image ? (
          <img
            src={image}
            alt={post.nombre}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
        )}

        {/* Badge Categoría (Top Left) */}
        <div className="absolute top-3 left-3 z-20">
          <Badge variant="category">{post.categoria || "Varios"}</Badge>
        </div>

        {/* Favorite (Top Right) */}
        <div className="absolute top-3 right-3 z-20">
          <FavoriteButton isFavorite={isFavorite} onClick={() => onToggleFavorite(post.id)} />
        </div>

        {/* Precio (Bottom Right - Con efecto Pop) */}
        <div className="absolute bottom-3 right-3 z-20 transform transition-transform duration-300 group-hover:scale-105">
          <Badge variant="price">{formatCLP(post.precioActual || 0)}</Badge>
        </div>
      </div>

      {/* 2. Contenido */}
      <div className="flex flex-col flex-1 p-4">
        {/* Vendedor Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full p-[1.5px] bg-gradient-to-tr from-primary/50 to-primary shadow-sm">
            <div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center">
              {post.vendedor?.fotoPerfilUrl ? (
                <img src={post.vendedor.fotoPerfilUrl} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-primary">{getInitials(post.vendedor?.usuario)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {post.vendedor?.usuario}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(post.fechaAgregado)}
            </span>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-sm font-bold text-card-foreground line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
          {post.nombre}
        </h3>

        {/* Descripción Corta */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
          {post.descripcion || "Sin descripción detallada."}
        </p>

        {/* Footer Card */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            {post.vendedor?.reputacion ? Number(post.vendedor.reputacion).toFixed(1) : "N/A"}
          </div>
          
          <div className="flex items-center text-xs font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Ver detalle <ChevronRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. SEARCH FILTERS BAR (Floating Glass Panel)
// ============================================================================

export const SearchFiltersBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  totalPosts,
  isLoading,
}: any) => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  // Ocultar al hacer scroll hacia abajo, mostrar al subir o estar arriba
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1, pointerEvents: "auto" },
        hidden: { y: -20, opacity: 0, pointerEvents: "none" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-4 z-30 px-2 sm:px-0"
    >
      <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-foreground/5 border border-border p-2 sm:p-3 ring-1 ring-foreground/5 transition-all">
        <div className="flex flex-col md:flex-row gap-2">
          
          {/* Input Búsqueda */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos, libros, servicios..."
              className="h-10 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all border border-transparent focus:border-primary/50 text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden md:block w-px bg-border mx-1 my-2" />

          {/* Select Categoría */}
          <div className="relative md:w-64 group">
            <select
              className="h-10 w-full appearance-none rounded-xl bg-muted/50 pl-3 pr-10 text-sm font-medium text-foreground outline-none cursor-pointer hover:bg-muted focus:bg-card focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/50"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary pointer-events-none transition-colors" />
          </div>
        </div>

        {/* Contador de Resultados (Sutil) */}
        {!isLoading && totalPosts > 0 && (
          <div className="hidden md:flex justify-end mt-2 px-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              {totalPosts} Resultados encontrados
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// 5. PRODUCT DETAIL MODAL (Clean & Focused)
// ============================================================================

export function ProductDetailModal({
  open,
  onClose,
  post,
  isFavorite,
  onToggleFavorite,
  onContact,
}: {
  open: boolean
  onClose: () => void
  post: Post | null
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
  onContact: (post: Post) => void
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendMessage, startTransaction } = useContactSeller();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  
  const [cachedPost, setCachedPost] = useState<Post | null>(post);
  useEffect(() => {
    if (open && post) {
      setCachedPost(post);
      setMessage('');
      setSentSuccess(false);
      setIsSending(false);
    }
  }, [open, post]);

  if (!open && !cachedPost) return null;
  const activePost = post || cachedPost;
  if (!activePost) return null;

  const isOwnProduct = user?.id === activePost.vendedor?.id;

  const details = [
    { label: "Precio", value: formatCLP(activePost.precioActual || 0), highlight: true },
    { label: "Categoría", value: activePost.categoria },
    { label: "Estado", value: activePost.estado || "Usado" },
    { label: "Campus", value: activePost.vendedor?.campus || "N/A" },
  ];

  const handleSendInsideModal = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    const txResult = await startTransaction(activePost.id, activePost.vendedor.id);
    if (!txResult?.ok) {
      alert(txResult.message);
      setIsSending(false);
      return;
    }
    const success = await sendMessage(activePost.vendedor.id, message);
    if (success) setSentSuccess(true);
    else alert("Error enviando mensaje");
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-5xl flex-col md:flex-row bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] z-10 border border-border"
          >
            {/* Close Button Mobile */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-card/50 backdrop-blur-md rounded-full md:hidden text-foreground"
            >
              <X size={20} />
            </button>

            {/* SECCIÓN IZQUIERDA: IMAGENES */}
            <div className="w-full md:w-[60%] bg-muted/20 p-6 flex flex-col overflow-y-auto">
              <div className="hidden md:flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{activePost.nombre}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                  <X size={20} />
                </Button>
              </div>

              <ImageCarousel 
                images={activePost.imagenes} 
                altPrefix={activePost.nombre} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(activePost.id)}
              />

              {/* Descripción */}
              <div className="mt-8 space-y-4">
                <div className="flex flex-wrap gap-2">
                   {details.map((d, i) => (
                     <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${d.highlight ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        <span className="opacity-70 mr-1">{d.label}:</span> 
                        <span className="font-bold">{d.value}</span>
                     </div>
                   ))}
                </div>
                
                <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Tag size={16} className="text-primary" /> Descripción
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {activePost.descripcion || "El vendedor no ha añadido una descripción."}
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN DERECHA: SIDEBAR DE ACCIÓN */}
            <div className="w-full md:w-[40%] bg-card border-l border-border flex flex-col h-full">
              {/* Header Vendedor */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full p-[2px] bg-gradient-to-tr from-primary/50 to-primary">
                    <div className="h-full w-full rounded-full bg-card overflow-hidden p-[2px]">
                       <img 
                          src={activePost.vendedor.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${activePost.vendedor.usuario}`} 
                          className="w-full h-full object-cover rounded-full" 
                       />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{activePost.vendedor.usuario}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{Number(activePost.vendedor.reputacion).toFixed(1)}</span>
                      <span>• {activePost.vendedor.campus || "UCT"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat / Contacto */}
              <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-muted/10">
                {isOwnProduct ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 border-2 border-dashed border-border rounded-xl">
                    <ShoppingBag size={40} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Estás viendo tu propia publicación</p>
                    <Button variant="outline" className="mt-4" onClick={onClose}>Volver</Button>
                  </div>
                ) : sentSuccess ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-green-500/10 rounded-2xl border border-green-500/20">
                    <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">¡Mensaje Enviado!</h3>
                    <p className="text-sm text-muted-foreground mb-6">El vendedor recibirá tu mensaje al instante.</p>
                    <Button 
                      onClick={() => { navigate('/chats', { state: { toUser: activePost.vendedor } }); onClose(); }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                    >
                      Ir a mis Chats
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Enviar mensaje rápido
                      </label>
                      <div className="relative group">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={`Hola ${activePost.vendedor.usuario}, me interesa este producto...`}
                          className="w-full p-4 text-sm bg-card border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-32 transition-all shadow-sm group-hover:shadow-md text-foreground placeholder:text-muted-foreground"
                        />
                        <button 
                          onClick={handleSendInsideModal}
                          disabled={!message || isSending}
                          className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                        >
                          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-auto">
                      {["¿Sigue disponible?", "¿Precio conversable?", "¿Dónde entregas?"].map((txt) => (
                        <Badge key={txt} variant="suggestion" onClick={() => setMessage(txt)}>
                          {txt}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                      <Button 
                        onClick={() => onContact(activePost)} 
                        className="w-full h-12 text-base shadow-xl shadow-primary/20" 
                        variant="default"
                      >
                        Comprar / Chat Directo
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground mt-3">
                        Protegemos tus datos. No compartas información financiera fuera del chat.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}