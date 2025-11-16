import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, ChevronLeft, ChevronRight, 
  ShoppingBag, Star, Filter, Heart, Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Imports Externos ---
import { usePostsWithFilters } from '@/features/Marketplace/Marketplace.Hooks/usePostsWithFilters';
import type { Post } from '@/features/Marketplace/Marketplace.Types/ProductInterfaces';
import { formatInt, formatCLP } from '@/features/Marketplace/Marketplace.Utils/format';
import { useAuth } from '@/app/context/AuthContext';

// --- Configuración ---
const API_URL = import.meta.env.VITE_API_URL;

// --- Utilidades ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatDate = (d?: string | number | Date | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-CL", { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  } catch { return ""; }
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name.substring(0, 2).toUpperCase();
};

// ---------------------------------------------------------------------------
// 1. HOOK DE FAVORITOS (Lógica de Backend)
// ---------------------------------------------------------------------------
function useFavorites() {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Cargar favoritos al iniciar
  useEffect(() => {
    if (!token) return;
    
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/api/favorites?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) {
          // Creamos un Set con los IDs de productos que son favoritos
          const ids = new Set(data.favorites.map((fav: any) => fav.productoId));
          setFavoriteIds(ids as Set<number>);
        }
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      }
    };

    fetchFavorites();
  }, [token]);

  // Función para dar like/dislike
  const toggleFavorite = async (productId: number) => {
    if (!token) return; // O redirigir a login

    const isFav = favoriteIds.has(productId);
    
    // 1. Actualización Optimista (UI instantánea)
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (isFav) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });

    try {
      const method = isFav ? 'DELETE' : 'POST';
      // La ruta DELETE es /api/favorites/:id, la POST es /api/favorites con body
      const url = isFav 
        ? `${API_URL}/api/favorites/${productId}` 
        : `${API_URL}/api/favorites`;
      
      const options: RequestInit = {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (!isFav) {
        options.body = JSON.stringify({ productoId: productId });
      }

      const res = await fetch(url, options);
      
      if (!res.ok) throw new Error("Falló la petición");

    } catch (error) {
      console.error("Error actualizando favorito:", error);
      // Revertir cambio si falla
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        if (isFav) newSet.add(productId);
        else newSet.delete(productId);
        return newSet;
      });
    }
  };

  return { favoriteIds, toggleFavorite };
}

// ---------------------------------------------------------------------------
// 2. COMPONENTES UI
// ---------------------------------------------------------------------------

const Badge = ({ children, className, variant = 'default', onClick }: { children: React.ReactNode, className?: string, variant?: 'default'|'secondary'|'outline'|'price'|'category'|'suggestion', onClick?: () => void }) => {
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 border-transparent",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent",
    outline: "text-slate-950 border-slate-200",
    price: "bg-emerald-600 text-white font-bold shadow-sm border-transparent",
    category: "bg-white/90 backdrop-blur text-slate-900 font-medium shadow-sm border-transparent",
    suggestion: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 cursor-pointer transition-all active:scale-95"
  };
  return (
    <div 
      onClick={onClick}
      className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors focus:outline-none", variants[variant], className)}
    >
      {children}
    </div>
  );
};

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'secondary', size?: 'default' | 'sm' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90 shadow-sm",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-sm",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      icon: "h-9 w-9",
    };
    return (
      <button ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
  </div>
);

// --- BOTÓN DE CORAZÓN (Reutilizable) ---
const FavoriteButton = ({ isFavorite, onClick, className }: { isFavorite: boolean, onClick: () => void, className?: string }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={cn(
      "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
      isFavorite 
        ? "bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100" 
        : "bg-white/90 text-slate-400 backdrop-blur-sm hover:bg-white hover:text-red-400 hover:shadow-md",
      className
    )}
    title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
  >
    <Heart 
      className={cn("h-5 w-5 transition-all", isFavorite && "fill-current scale-110")} 
      strokeWidth={isFavorite ? 0 : 2}
    />
  </button>
);

// ---------------------------------------------------------------------------
// 3. CARRUSEL DE IMÁGENES (Con Favoritos)
// ---------------------------------------------------------------------------
function ImageCarousel({ images, altPrefix, isFavorite, onToggleFavorite }: { images: string[], altPrefix?: string, isFavorite?: boolean, onToggleFavorite?: () => void }) {
  const [index, setIndex] = useState(0);
  const validImages = images?.length ? images : ["/img/placeholder-product.png"];
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thumbRef.current) {
      const el = thumbRef.current.children[index] as HTMLElement;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [index]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100 group border border-slate-100">
        <AnimatePresence mode='wait'>
          <motion.img 
            key={index}
            src={validImages[index]}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            alt={`${altPrefix} ${index + 1}`}
            className="h-full w-full object-cover md:object-contain bg-white"
          />
        </AnimatePresence>
        
        {/* BOTÓN DE FAVORITOS EN CARRUSEL */}
        {onToggleFavorite && (
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton isFavorite={!!isFavorite} onClick={onToggleFavorite} />
          </div>
        )}
        
        {/* Flechas de Navegación */}
        {validImages.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + validImages.length) % validImages.length) }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 backdrop-blur-md transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100 shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % validImages.length) }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 backdrop-blur-md transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100 shadow-sm">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {validImages.length > 1 && (
        <div ref={thumbRef} className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                i === index ? "border-slate-900 ring-2 ring-slate-900/20 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. MODAL DE DETALLE (Actualizado)
// ---------------------------------------------------------------------------
function ProductDetailModal({ open, onClose, post, isFavorite, onToggleFavorite }: { open: boolean, onClose: () => void, post: Post | null, isFavorite: boolean, onToggleFavorite: (id: number) => void }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const quickReplies = ["¡Hola! ¿Sigue disponible?", "¿El precio es conversable?", "¿Dónde entregas?"];

  useEffect(() => {
    if (open) { setMessage(''); setSentSuccess(false); setIsSending(false); }
  }, [open, post]);

  if (!post) return null;

  const details = [
    { label: "Precio", value: formatCLP(post.precioActual || 0), highlight: true },
    { label: "Stock", value: post.cantidad || 1 },
    { label: "Campus", value: post.vendedor?.campus || "No especificado" },
    { label: "Categoría", value: post.categoria },
    { label: "Condición", value: post.estado || "Usado" },
    { label: "Publicado", value: formatDate(post.fechaAgregado) },
  ];

  const isOwnProduct = user?.id === post.vendedor?.id;

  const handleSendMessage = async () => {
    if (!message.trim() || !token || !post.vendedor) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ destinatarioId: post.vendedor.id, contenido: message, tipo: 'texto' })
      });
      if (res.ok) setSentSuccess(true);
      else alert("Error al enviar mensaje");
    } catch (error) { console.error("Error enviando mensaje", error); } 
    finally { setIsSending(false); }
  };

  const goToChat = () => { navigate('/chats', { state: { toUser: post.vendedor } }); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row max-h-[90vh] z-10">
            
            {/* IZQUIERDA */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div className="hidden md:flex items-start justify-between mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{post.nombre}</h1>
                <Button variant="outline" size="icon" className="rounded-full" onClick={onClose}><X size={18} /></Button>
              </div>

              <ImageCarousel 
                images={post.imagenes?.map(i => i.url || "") || []} 
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(post.id)}
              />

              <div className="mt-6 space-y-4">
                 <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{post.categoria}</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">{post.estado}</Badge>
                    {post.vendedor?.campus && <Badge variant="secondary" className="text-slate-500 font-normal">{post.vendedor.campus}</Badge>}
                 </div>
                 <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Descripción</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.descripcion || "El vendedor no proporcionó una descripción detallada."}</p>
                 </div>
              </div>
            </div>

            {/* DERECHA */}
            <div className="w-full md:w-[380px] bg-slate-50 border-l border-slate-100 p-6 flex flex-col overflow-y-auto shrink-0">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Vendedor</div>
                <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                     {post.vendedor?.fotoPerfilUrl ? <img src={post.vendedor.fotoPerfilUrl} className="w-full h-full object-cover"/> : getInitials(post.vendedor?.nombre)}
                   </div>
                   <div>
                      <div className="font-semibold text-slate-900">{post.vendedor?.nombre || "Usuario"}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500"><Star size={12} className="fill-yellow-400 text-yellow-400" /> {post.vendedor?.reputacion ? Number(post.vendedor.reputacion).toFixed(1) : "5.0"}</div>
                   </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {details.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-baseline border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className={cn("text-sm font-medium text-slate-900", item.highlight && "text-emerald-600 font-bold text-base")}>{item.value}</span>
                    </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-200">
                {isOwnProduct ? (
                   <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-medium">Este es tu producto</div>
                ) : sentSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><Check size={24} /></div>
                    <h3 className="font-bold text-green-800 mb-1">¡Mensaje Enviado!</h3>
                    <Button onClick={goToChat} className="w-full bg-green-600 hover:bg-green-700 text-white mt-2">Ir al chat</Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Enviar mensaje al vendedor</label>
                    <div className="relative">
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe tu mensaje aquí..." className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24 bg-white" />
                      <div className="absolute bottom-2 right-2">
                         <Button size="icon" className={cn("h-8 w-8 rounded-lg transition-all", message ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 text-slate-400")} disabled={!message || isSending} onClick={handleSendMessage}>
                           {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={14} />}
                         </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickReplies.map((reply, i) => <Badge key={i} variant="suggestion" onClick={() => setMessage(reply)}>{reply}</Badge>)}
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

// ---------------------------------------------------------------------------
// 5. TARJETA DEL FEED
// ---------------------------------------------------------------------------
function ItemCard({ post, onClick, isFavorite, onToggleFavorite }: { post: Post, onClick: (p: Post) => void, isFavorite: boolean, onToggleFavorite: (id: number) => void }) {
  const { nombre, precioActual, categoria, imagenes, vendedor, fechaAgregado } = post;
  const image = imagenes?.[0]?.url;

  return (
    <div onClick={() => onClick(post)} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img src={image} alt={nombre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag size={48} strokeWidth={1} /></div>
        )}
        <div className="absolute top-3 left-3"><Badge variant="category">{categoria || "Varios"}</Badge></div>
        <div className="absolute top-3 right-3 z-10">
           {/* Botón Favorito en la Card */}
           <FavoriteButton isFavorite={isFavorite} onClick={() => onToggleFavorite(post.id)} />
        </div>
        <div className="absolute bottom-3 right-3"><Badge variant="price">{formatCLP(precioActual || 0)}</Badge></div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden">
             {vendedor?.fotoPerfilUrl ? <img src={vendedor.fotoPerfilUrl} alt={vendedor.nombre} className="w-full h-full object-cover" /> : getInitials(vendedor?.nombre)}
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700">{vendedor?.nombre}</span>
              <span className="text-[10px] text-slate-400 leading-none">{formatDate(fechaAgregado)}</span>
           </div>
        </div>
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 text-base">{nombre}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{post.descripcion || "Sin descripción."}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
           <div className="flex items-center gap-1 text-slate-400"><Star size={14} className="fill-slate-200 text-slate-200" /><span className="text-xs font-medium">5.0</span></div>
           <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">Ver detalle</Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. PÁGINA PRINCIPAL
// ---------------------------------------------------------------------------
export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const categories = useMemo(() => ['Electrónicos', 'Libros y Materiales', 'Ropa y Accesorios', 'Deportes', 'Hogar y Jardín', 'Vehículos', 'Servicios'], []);
  const categoryMap: Record<string, string> = {
    'Electrónicos': 'electronics', 'Libros y Materiales': 'books', 'Ropa y Accesorios': 'clothing', 
    'Deportes': 'sports', 'Hogar y Jardín': 'home', 'Vehículos': 'vehicles', 'Servicios': 'services',
  };
  const selectedCategoryId = selectedCategory ? (categoryMap[selectedCategory] ?? '') : '';

  const { posts, hasNextPage, fetchNextPage, isLoading, isError } = usePostsWithFilters({
    searchTerm, categoryId: selectedCategoryId
  });

  // Hook de favoritos
  const { favoriteIds, toggleFavorite } = useFavorites();

  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, fetchNextPage]);

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto scroll-smooth">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Buscador */}
        <div className="sticky top-0 z-20 bg-[#F8FAFC]/95 backdrop-blur-md py-2 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent">
          <div className="flex flex-col md:flex-row gap-3 rounded-xl bg-white p-2 shadow-sm border border-slate-200">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar por título o descripción..." className="h-10 w-full rounded-md bg-transparent px-9 text-sm outline-none placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="h-px w-full bg-slate-100 md:h-auto md:w-px" />
            <div className="relative md:w-64">
                <select className="h-10 w-full appearance-none rounded-md bg-transparent px-3 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:bg-slate-50" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">Todas las categorías</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {!isLoading && <div className="mt-2 text-xs text-slate-500 font-medium px-1">Mostrando {posts.length} publicaciones</div>}
        </div>

        {/* Grid de Productos */}
        {isLoading && posts.length === 0 ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl border border-red-100">
             Error al cargar datos. Revisa tu conexión.
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-50"/>
            <p>No se encontraron publicaciones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post, i) => (
              <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
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
        
        {isLoading && posts.length > 0 && <LoadingSpinner />}
      </div>

      {selectedPost && (
        <ProductDetailModal 
          open={!!selectedPost} 
          onClose={() => setSelectedPost(null)} 
          post={selectedPost} 
          isFavorite={favoriteIds.has(selectedPost.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}