import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  Filter,
  Heart,
  Loader2,
  Send,
  Check,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '@/app/context/AuthContext';
import {
  useContactSeller,
  formatCLP,
  formatDate,
  getInitials,
} from './home.hooks';
import type { Post } from './home.types';

// Magic UI
import { MagicCard } from '@/components/ui/magic-card';
import { WarpBackground } from '@/components/ui/warp-background';
import { SparklesText } from '@/components/ui/sparkles-text';

// --- UTILIDADES UI ---
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
  children: React.ReactNode;
  className?: string;
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'price'
    | 'category'
    | 'suggestion';
  onClick?: () => void;
}) => {
  const variants: Record<string, string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800 border-transparent',
    secondary:
      'bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent',
    outline: 'text-slate-950 border-slate-200',
    price:
      'bg-emerald-600 text-white font-bold shadow-sm border-transparent tracking-tight',
    category:
      'bg-white/90 backdrop-blur text-slate-900 font-medium shadow-sm border-transparent',
    suggestion:
      'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 cursor-pointer transition-all active:scale-95',
  };
  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
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
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'icon';
    loading?: boolean;
  }
>(({ className, variant = 'default', size = 'default', loading, children, ...props }, ref) => {
  const variants: Record<string, string> = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90 shadow-sm',
    outline:
      'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-sm',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200/80',
    ghost: 'hover:bg-slate-100 hover:text-slate-900',
  };
  const sizes: Record<string, string> = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    icon: 'h-9 w-9',
  };
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
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
});
Button.displayName = 'Button';

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
  </div>
);

export const FavoriteButton = ({
  isFavorite,
  onClick,
  className,
}: {
  isFavorite: boolean;
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      'group relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90',
      isFavorite
        ? 'bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100'
        : 'bg-white/90 text-slate-400 backdrop-blur-sm hover:bg-white hover:text-red-400 hover:shadow-md',
      className
    )}
    title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
  >
    <Heart
      className={cn(
        'h-5 w-5 transition-all text-red-500',
        isFavorite && 'fill-red-500 scale-110'
      )}
      strokeWidth={2}
    />
  </button>
);

// ============================================================================
// 2. COMPONENTES COMPLEJOS (Carrusel, SearchBar, Card)
// ============================================================================

export function ImageCarousel({
  images,
  altPrefix,
  isFavorite,
  onToggleFavorite,
}: {
  images: { id: number; url: string }[] | undefined | null;
  altPrefix?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [index, setIndex] = useState(0);

  const validImages = useMemo(() => {
    if (images && images.length > 0) return images;
    return [{ id: 0, url: '/img/placeholder-product.png' }];
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
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 border border-slate-200 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.img
            key={validImages[index].id}
            src={validImages[index].url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            alt={`${altPrefix || 'Producto'} - Imagen ${index + 1}`}
            className="h-full w-full object-contain bg-white"
          />
        </AnimatePresence>
        {onToggleFavorite && (
          <div className="absolute top-3 right-3 z-20">
            <FavoriteButton isFavorite={!!isFavorite} onClick={onToggleFavorite} />
          </div>
        )}
        {validImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
              {validImages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all shadow-sm',
                    i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
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
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                i === index
                  ? 'border-slate-900 ring-2 ring-slate-900/10 opacity-100 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
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
  post: Post;
  onClick: (p: Post) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}) => {
  const image = post.imagenes?.[0]?.url;

  return (
    <MagicCard
      onClick={() => onClick(post)}
      gradientFrom="#2563eb"
      gradientTo="#22c55e"
      gradientColor="#020617"
      gradientOpacity={0.18}
      gradientSize={260}
      className="group cursor-pointer rounded-2xl"
    >
      <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {image ? (
            <img
              src={image}
              alt={post.nombre}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <ShoppingBag size={48} strokeWidth={1} />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="category">{post.categoria || 'Varios'}</Badge>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton isFavorite={isFavorite} onClick={() => onToggleFavorite(post.id)} />
          </div>
          <div className="absolute bottom-3 right-3">
            <Badge variant="price">{formatCLP(post.precioActual || 0)}</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden">
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
              <span className="text-xs font-semibold text-slate-700">
                {post.vendedor?.usuario}
              </span>
              <span className="text-[10px] text-slate-400 leading-none">
                {formatDate(post.fechaAgregado)}
              </span>
            </div>
          </div>
          <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 text-base">
            {post.nombre}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
            {post.descripcion || 'Sin descripción.'}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
            <div className="flex items-center gap-1 text-slate-400">
              <Star size={14} className="fill-slate-200 text-slate-200" />
              <span className="text-xs font-medium">
                {post.vendedor?.reputacion
                  ? Number(post.vendedor.reputacion).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">
              Ver detalle
            </Button>
          </div>
        </div>
      </div>
    </MagicCard>
  );
};

export const SearchFiltersBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  totalPosts,
  isLoading,
}: any) => {
  // --- LÓGICA DE SCROLL (ocultar al bajar, mostrar al subir) ---
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    // Siempre visible cerca del top
    if (latest < 80) {
      setHidden(false);
      return;
    }

    // Si bajamos un poco → ocultar
    if (diff > 4 && latest > 100) {
      setHidden(true);
    }
    // Si subimos un poco → mostrar
    if (diff < -4) {
      setHidden(false);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: -80, opacity: 0.0 },
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="sticky top-0 z-20 py-2 px-4 md:px-0 pointer-events-none"
    >
      <MagicCard
        gradientFrom="#2563eb"
        gradientTo="#22c55e"
        gradientColor="#0f172a"
        gradientOpacity={0.16}
        gradientSize={260}
        className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm"
      >
        <div className="p-2">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos, apuntes..."
                className="h-10 w-full rounded-md bg-slate-50 px-9 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-slate-200 mx-1 my-1" />
            <div className="relative md:w-64">
              <select
                className="h-10 w-full appearance-none rounded-md bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:bg-slate-100 focus:bg-white transition-all"
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
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {!isLoading && (
            <div className="mt-2 px-1 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-[0.14em] text-[10px] text-slate-400">
                  Resultados
                </span>
                <SparklesText className="text-xs font-semibold text-slate-800">
                  {totalPosts} publicaciones
                </SparklesText>
              </div>
              <span className="hidden md:block text-[11px] text-slate-400">
                Filtra por categoría o busca por nombre para encontrar más rápido.
              </span>
            </div>
          )}
        </div>
      </MagicCard>
    </motion.div>
  );
};

// ============================================================================
// 5. MODAL DE DETALLE DE PRODUCTO
// ============================================================================

export function ProductDetailModal({
  open,
  onClose,
  post,
  isFavorite,
  onToggleFavorite,
  onContact,
}: {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onContact: (post: Post) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendMessage } = useContactSeller();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const quickReplies = [
    '¡Hola! ¿Sigue disponible?',
    '¿El precio es conversable?',
    '¿Dónde entregas?',
  ];

  useEffect(() => {
    if (open) {
      setMessage('');
      setSentSuccess(false);
      setIsSending(false);
    }
  }, [open, post]);

  if (!post) return null;

  const details = [
    { label: 'Precio', value: formatCLP(post.precioActual || 0), highlight: true },
    { label: 'Stock', value: post.cantidad || 1 },
    { label: 'Campus', value: post.vendedor?.campus || 'No especificado' },
    { label: 'Categoría', value: post.categoria },
    { label: 'Condición', value: post.estado || 'Usado' },
    { label: 'Publicado', value: formatDate(post.fechaAgregado) },
  ];

  const isOwnProduct = user?.id === post.vendedor?.id;

  const handleSendInsideModal = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    const success = await sendMessage(post.vendedor.id, message);
    if (success) setSentSuccess(true);
    else alert('Error enviando mensaje');
    setIsSending(false);
  };

  const goToChat = () => {
    navigate('/chats', { state: { toUser: post.vendedor } });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <WarpBackground className="relative z-10 w-full max-w-5xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl md:flex-row max-h-[90vh] border border-slate-100"
            >
              <div className="flex-1 overflow-y-auto p-6 bg-white/95">
                <div className="hidden md:flex items-start justify-between mb-6">
                  <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {post.nombre}
                  </h1>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={onClose}
                  >
                    <X size={18} />
                  </Button>
                </div>

                <ImageCarousel
                  images={post.imagenes}
                  altPrefix={post.nombre}
                  isFavorite={isFavorite}
                  onToggleFavorite={() => onToggleFavorite(post.id)}
                />

                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{post.categoria}</Badge>
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-200 bg-blue-50"
                    >
                      {post.estado}
                    </Badge>
                    {post.vendedor?.campus && (
                      <Badge
                        variant="secondary"
                        className="text-slate-500 font-normal"
                      >
                        {post.vendedor.campus}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Descripción</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {post.descripcion ||
                        'El vendedor no proporcionó una descripción detallada.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[380px] bg-slate-50/90 border-l border-slate-100 p-6 flex flex-col overflow-y-auto shrink-0">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                    {post.vendedor?.fotoPerfilUrl ? (
                      <img
                        src={post.vendedor.fotoPerfilUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(post.vendedor?.usuario)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {post.vendedor?.usuario || 'Usuario'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Star
                        size={12}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      {post.vendedor?.reputacion
                        ? Number(post.vendedor.reputacion).toFixed(1)
                        : '0.0'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  {details.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-baseline border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span
                        className={cn(
                          'text-sm font-medium text-slate-900',
                          item.highlight &&
                            'text-emerald-600 font-bold text-base tracking-tight'
                        )}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-200">
                  {isOwnProduct ? (
                    <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-medium">
                      Este es tu producto
                    </div>
                  ) : sentSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border border-green-100 rounded-xl p-6 text-center"
                    >
                      <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                        <Check size={24} />
                      </div>
                      <h3 className="font-bold text-green-800 mb-1">
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
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Enviar mensaje al vendedor
                      </label>
                      <div className="relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Escribe tu mensaje aquí..."
                          className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24 bg-white"
                        />
                        <div className="absolute bottom-2 right-2">
                          <Button
                            size="icon"
                            className={cn(
                              'h-8 w-8 rounded-lg transition-all',
                              message
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-slate-200 text-slate-400'
                            )}
                            disabled={!message || isSending}
                            onClick={handleSendInsideModal}
                          >
                            {isSending ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickReplies.map((reply, i) => (
                          <Badge
                            key={i}
                            variant="suggestion"
                            onClick={() => setMessage(reply)}
                          >
                            {reply}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full mt-2 font-bold bg-slate-900 text-white"
                        onClick={() => onContact(post)}
                      >
                        Ir al Chat Directo
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </WarpBackground>
        </div>
      )}
    </AnimatePresence>
  );
}
