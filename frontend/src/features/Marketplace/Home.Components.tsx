import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  Search, X, ChevronLeft, ChevronRight, 
  ShoppingBag, Star, Filter, Heart, Loader2,
  Send, Check
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '@/app/context/AuthContext';
import { useContactSeller, formatCLP, formatDate, getInitials } from './home.hooks';
import type { Post } from './home.types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 1. ÁTOMOS (Con Paleta Semántica)
// ============================================================================

export const Badge = ({
  children,
  className,
  variant = 'default',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  variant?: 'default'|'secondary'|'outline'|'price'|'category'|'suggestion'
  onClick?: () => void
}) => {
  const variants = {
    // Usa colores de la marca
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border-border border",
    // Precio: Destacado pero elegante
    price: "bg-primary text-primary-foreground font-bold shadow-sm",
    // Categoría: Sutil, tipo vidrio
    category: "bg-background/80 backdrop-blur text-foreground font-medium shadow-sm border border-border",
    // Sugerencia: Interactivo
    suggestion: "bg-secondary/50 text-secondary-foreground border border-secondary hover:bg-secondary cursor-pointer active:scale-95"
  };
  return (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs transition-colors",
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
    variant?: 'default' | 'outline' | 'ghost' | 'secondary'
    size?: 'default' | 'sm' | 'icon'
    loading?: boolean
  }
>(
  (
    { className, variant = 'default', size = 'default', loading, children, ...props },
    ref
  ) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    };
    const sizes = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-md px-3 text-xs",
      icon: "h-9 w-9",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
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
      "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
      isFavorite
        ? "bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100 dark:bg-red-950 dark:text-red-400 dark:ring-red-900" // Corazón rojo se mantiene por convención universal
        : "bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-background hover:text-red-400 hover:shadow-md",
      className
    )}
  >
    <Heart
      className={cn(
        "h-5 w-5 transition-all",
        isFavorite ? "fill-current scale-110" : "text-current"
      )}
      strokeWidth={2}
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

  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (thumbRef.current) {
      const el = thumbRef.current.children[index] as HTMLElement;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [index]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % validImages.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="flex flex-col gap-3 relative group">
      <div className="relative w-full overflow-hidden rounded-xl bg-muted border border-border shadow-sm aspect-[16/9] sm:aspect-[4/3]">
        <AnimatePresence mode="wait">
          <motion.img
            key={validImages[index].id}
            src={validImages[index].url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            alt={`${altPrefix || 'Producto'} - Imagen ${index + 1}`}
            className="h-full w-full object-contain bg-background"
          />
        </AnimatePresence>

        {onToggleFavorite && (
          <div className="absolute top-3 right-3 z-20">
            <FavoriteButton
              isFavorite={!!isFavorite}
              onClick={onToggleFavorite}
            />
          </div>
        )}

        {validImages.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <button
                onClick={prevImage}
                className="pointer-events-auto rounded-full bg-background/80 p-2 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <button
                onClick={nextImage}
                className="pointer-events-auto rounded-full bg-background/80 p-2 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
              {validImages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all shadow-sm",
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/50" // Indicadores blancos sobre foto oscura
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {validImages.length > 1 && (
        <div
          ref={thumbRef}
          className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        >
          {validImages.map((img, i) => (
            <button
              key={img.id}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={cn(
                "relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all h-14 w-14 sm:h-16 sm:w-16",
                i === index
                  ? "border-primary ring-2 ring-primary/20 opacity-100 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100"
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
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-sm border border-border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
    >
      <div className="relative overflow-hidden bg-muted aspect-[16/9] sm:aspect-[4/3]">
        {image ? (
          <img
            src={image}
            alt={post.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground bg-muted">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="category">{post.categoria || "Varios"}</Badge>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            isFavorite={isFavorite}
            onClick={() => onToggleFavorite(post.id)}
          />
        </div>
        <div className="absolute bottom-3 right-3">
          <Badge variant="price">{formatCLP(post.precioActual || 0)}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 overflow-hidden border border-border">
            {post.vendedor?.fotoPerfilUrl ? (
              <img
                src={post.vendedor.fotoPerfilUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(post.vendedor?.usuario)
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] sm:text-xs font-semibold text-foreground line-clamp-1">
              {post.vendedor?.usuario}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              {formatDate(post.fechaAgregado)}
            </span>
          </div>
        </div>
        <h3 className="font-bold text-card-foreground line-clamp-1 mb-1 text-sm sm:text-base">
          {post.nombre}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 min-h-[2.3em]">
          {post.descripcion || "Sin descripción."}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star size={14} className="fill-yellow-400 text-yellow-400" /> 
            {/* Estrella amarilla es convención visual fuerte, se puede dejar o usar primary */}
            <span className="text-[11px] font-medium">
              {post.vendedor?.reputacion
                ? Number(post.vendedor.reputacion).toFixed(1)
                : "0.0"}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-[11px] font-semibold"
          >
            Ver detalle
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. SEARCH FILTERS BAR
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

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1, display: "block" },
        hidden: {
          y: -100,
          opacity: 0,
          transitionEnd: { display: "none" },
        },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sticky top-0 z-20 py-1 px-2 sm:px-4 md:px-0 pointer-events-none"
    >
      <div className="pointer-events-auto bg-background/95 backdrop-blur-md rounded-xl shadow-sm border border-border p-2 sm:p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar productos, apuntes..."
              className="h-9 sm:h-10 w-full rounded-md bg-muted/50 px-9 text-xs sm:text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring transition-all border border-transparent focus:border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="hidden md:block w-px bg-border mx-1 my-1" />
          <div className="relative md:w-64">
            <select
              className="h-9 sm:h-10 w-full appearance-none rounded-md bg-muted/50 px-3 text-xs sm:text-sm font-medium text-foreground outline-none cursor-pointer hover:bg-muted focus:bg-background transition-all border border-transparent focus:border-input"
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
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {!isLoading && (
          <div className="mt-2 px-1 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-medium border-t border-border pt-2">
            <span>Resultados: {totalPosts}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// 4. MODAL
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

  const details = [
    { label: "Precio", value: formatCLP(activePost.precioActual || 0), highlight: true },
    { label: "Stock", value: activePost.cantidad || 1 },
    { label: "Campus", value: activePost.vendedor?.campus || "No especificado" },
    { label: "Categoría", value: activePost.categoria },
    { label: "Condición", value: activePost.estado || "Usado" },
    { label: "Publicado", value: formatDate(activePost.fechaAgregado) },
  ];

  const isOwnProduct = user?.id === activePost.vendedor?.id;

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

  const goToChat = () => {
    navigate('/chats', { state: { toUser: activePost.vendedor } });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-md sm:max-w-2xl lg:max-w-5xl flex-col overflow-hidden rounded-xl sm:rounded-2xl bg-card text-card-foreground shadow-2xl md:flex-row max-h-[90vh] z-10 border border-border"
          >
            {/* Contenido Izquierdo (Fotos y Descripción) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card">
              <div className="hidden md:flex items-start justify-between mb-6">
                <h1 className="text-2xl font-extrabold text-foreground leading-tight">
                  {activePost.nombre}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={onClose}
                >
                  <X size={18} />
                </Button>
              </div>

              <ImageCarousel
                images={activePost.imagenes}
                altPrefix={activePost.nombre}
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(activePost.id)}
              />

              <div className="mt-5 sm:mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{activePost.categoria}</Badge>
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/20 bg-primary/5"
                  >
                    {activePost.estado}
                  </Badge>
                  {activePost.vendedor?.campus && (
                    <Badge variant="secondary" className="text-muted-foreground font-normal">
                      {activePost.vendedor.campus}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                    Descripción
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activePost.descripcion ||
                      "El vendedor no proporcionó una descripción detallada."}
                  </p>
                </div>
              </div>
            </div>

            {/* Barra Lateral (Info Vendedor y Contacto) */}
            <div className="w-full md:w-[360px] bg-muted/30 border-t md:border-t-0 md:border-l border-border p-4 sm:p-6 flex flex-col overflow-y-auto shrink-0">
              <div className="bg-card p-3 sm:p-4 rounded-xl border border-border shadow-sm mb-5 sm:mb-6 flex items-center gap-3">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base sm:text-lg shrink-0 overflow-hidden">
                  {activePost.vendedor?.fotoPerfilUrl ? (
                    <img
                      src={activePost.vendedor.fotoPerfilUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(activePost.vendedor?.usuario)
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm sm:text-base">
                    {activePost.vendedor?.usuario || "Usuario"}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                    <Star
                      size={12}
                      className="fill-yellow-400 text-yellow-400"
                    />{" "}
                    {activePost.vendedor?.reputacion
                      ? Number(activePost.vendedor.reputacion).toFixed(1)
                      : "0.0"}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5 sm:mb-6 bg-card p-3 sm:p-4 rounded-xl border border-border shadow-sm">
                {details.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-baseline border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-[11px] sm:text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-medium text-foreground",
                        item.highlight &&
                          "text-primary font-bold text-sm sm:text-base"
                      )}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                {isOwnProduct ? (
                  <div className="text-center p-4 bg-yellow-500/10 text-yellow-600 rounded-xl text-xs sm:text-sm font-medium border border-yellow-200/50">
                    Este es tu producto
                  </div>
                ) : sentSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 sm:p-6 text-center"
                  >
                    <div className="mx-auto w-11 h-11 sm:w-12 sm:h-12 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <Check size={24} />
                    </div>
                    <h3 className="font-bold text-green-700 mb-1 text-sm sm:text-base">
                      ¡Mensaje Enviado!
                    </h3>
                    <Button
                      onClick={goToChat}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                    >
                      Ir al chat
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Enviar mensaje al vendedor
                    </label>
                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none resize-none h-20 sm:h-24 bg-background text-foreground"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            message
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                          disabled={!message || isSending}
                          onClick={handleSendInsideModal}
                        >
                          {isSending ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : (
                            <Send size={14} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["¡Hola! ¿Disponible?", "¿Precio conversable?", "¿Dónde entregas?"].map(
                        (reply, i) => (
                          <Badge
                            key={i}
                            variant="suggestion"
                            onClick={() => setMessage(reply)}
                          >
                            {reply}
                          </Badge>
                        )
                      )}
                    </div>
                    <Button
                      className="w-full mt-2 font-bold"
                      onClick={() => onContact(activePost)}
                    >
                      Ir al Chat Directo
                    </Button>
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