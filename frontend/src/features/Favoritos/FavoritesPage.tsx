import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ShoppingBag, ArrowRight, Loader2, Search, X, 
  ChevronLeft, ChevronRight, Star, MessageCircle, Send, Check
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '@/app/context/AuthContext';
import { formatCLP, formatInt } from '@/features/Marketplace/Marketplace.Utils/format';
import type { Post } from '@/features/Marketplace/Marketplace.Types/ProductInterfaces';

// --- Configuración ---
const API_URL = import.meta.env.VITE_API_URL;

// --- Utilidades ---
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const formatDate = (d?: string | number | Date | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-CL", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ""; }
};

const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "U";

// --- COMPONENTES UI (Replicados del Marketplace para consistencia) ---

const Badge = ({ children, className, variant = 'default' }: any) => {
  const variants: any = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-900",
    outline: "text-slate-950 border-slate-200 border",
    price: "bg-emerald-600 text-white font-bold shadow-sm",
    category: "bg-white/90 backdrop-blur text-slate-900 font-medium shadow-sm"
  };
  return (
    <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors", variants[variant], className)}>
      {children}
    </div>
  );
};

const Button = ({ className, variant = 'default', ...props }: any) => {
  const variants: any = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-900",
  };
  return <button className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors disabled:opacity-50", variants[variant], className)} {...props} />;
};

// Botón de Favorito (Corazón)
const FavoriteButton = ({ isFavorite, onClick }: { isFavorite: boolean, onClick: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={cn(
      "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 shadow-sm",
      isFavorite ? "bg-red-50 text-red-500" : "bg-white/90 text-slate-400 hover:text-red-400"
    )}
  >
    <Heart className={cn("h-5 w-5 transition-all", isFavorite && "fill-current scale-110")} strokeWidth={isFavorite ? 0 : 2} />
  </button>
);

// --- CARRUSEL ---
function ImageCarousel({ images, altPrefix }: { images: string[], altPrefix?: string }) {
  const [index, setIndex] = useState(0);
  const validImages = images?.length ? images : ["/img/placeholder-product.png"];
  
  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100 border border-slate-100 group">
        <motion.img 
          key={index}
          src={validImages[index]}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="h-full w-full object-contain bg-white"
        />
        {validImages.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + validImages.length) % validImages.length) }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 opacity-0 group-hover:opacity-100 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % validImages.length) }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {validImages.map((img, i) => (
            <button key={i} onClick={() => setIndex(i)} className={cn("h-14 w-14 rounded-lg overflow-hidden border-2 transition-all", i === index ? "border-slate-900" : "border-transparent opacity-50")}>
              <img src={img} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- MODAL DETALLE ---
function ProductDetailModal({ open, onClose, post, onRemoveFavorite }: { open: boolean, onClose: () => void, post: Post | null, onRemoveFavorite: (id: number) => void }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  if (!post) return null;

  const handleContact = () => {
     navigate('/chats', { state: { toUser: post.vendedor } });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row max-h-[90vh] z-10">
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div className="flex justify-between items-start mb-4">
                 <h1 className="text-2xl font-extrabold text-slate-900">{post.nombre}</h1>
                 <Button variant="ghost" onClick={onClose}><X size={20} /></Button>
              </div>
              
              {/* Carrusel con botón de favorito superpuesto */}
              <div className="relative">
                 <ImageCarousel images={post.imagenes?.map(i => i.url || "") || []} />
                 <div className="absolute top-3 right-3 z-20">
                    <FavoriteButton isFavorite={true} onClick={() => { onRemoveFavorite(post.id); onClose(); }} />
                 </div>
              </div>

              <div className="mt-6 space-y-4">
                 <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{post.categoria}</Badge>
                    <Badge variant="outline" className="text-blue-600 bg-blue-50">{post.estado}</Badge>
                 </div>
                 <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Descripción</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{post.descripcion || "Sin descripción."}</p>
                 </div>
              </div>
            </div>

            <div className="w-full md:w-[380px] bg-slate-50 border-l border-slate-100 p-6 flex flex-col overflow-y-auto shrink-0">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
                 <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg overflow-hidden">
                    {post.vendedor?.fotoPerfilUrl ? <img src={post.vendedor.fotoPerfilUrl} className="w-full h-full object-cover" /> : getInitials(post.vendedor?.nombre)}
                 </div>
                 <div>
                    <div className="font-semibold text-slate-900">{post.vendedor?.nombre}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Star size={12} className="fill-yellow-400 text-yellow-400"/> {Number(post.vendedor?.reputacion || 0).toFixed(1)}</div>
                 </div>
              </div>

              <div className="space-y-3 flex-1">
                 <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500">Precio</span><span className="font-bold text-emerald-600 text-lg">{formatCLP(post.precioActual || 0)}</span></div>
                 <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500">Stock</span><span className="font-medium">{post.cantidad}</span></div>
                 <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500">Campus</span><span className="font-medium">{post.vendedor?.campus}</span></div>
              </div>

              <div className="mt-auto pt-4 flex gap-3">
                 <Button variant="outline" className="flex-1" onClick={onClose}>Cerrar</Button>
                 <Button className="flex-1 bg-slate-900 text-white" onClick={handleContact}>Contactar</Button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- TARJETA DE GRID (Idéntica a Marketplace) ---
const ItemCard = ({ post, onClick, onRemove }: { post: Post, onClick: (p: Post) => void, onRemove: (id: number) => void }) => {
  const image = post.imagenes?.[0]?.url;

  return (
    <div onClick={() => onClick(post)} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img src={image} alt={post.nombre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300"><ShoppingBag size={48} strokeWidth={1} /></div>
        )}
        <div className="absolute top-3 left-3"><Badge variant="category">{post.categoria || "Varios"}</Badge></div>
        <div className="absolute top-3 right-3 z-10">
           <FavoriteButton isFavorite={true} onClick={() => onRemove(post.id)} />
        </div>
        <div className="absolute bottom-3 right-3"><Badge variant="price">{formatCLP(post.precioActual || 0)}</Badge></div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden">
             {post.vendedor?.fotoPerfilUrl ? <img src={post.vendedor.fotoPerfilUrl} className="w-full h-full object-cover" /> : getInitials(post.vendedor?.nombre)}
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700">{post.vendedor?.nombre}</span>
              <span className="text-[10px] text-slate-400 leading-none">{formatDate(post.fechaAgregado)}</span>
           </div>
        </div>
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 text-base">{post.nombre}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{post.descripcion || "Sin descripción."}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
           <div className="flex items-center gap-1 text-slate-400"><Star size={14} className="fill-slate-200 text-slate-200" /><span className="text-xs font-medium">5.0</span></div>
           <Button variant="outline" className="h-8 text-xs">Ver detalle</Button>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL DE FAVORITOS ---
export default function FavoritesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar Favoritos y transformarlos a Post[]
  useEffect(() => {
    if (!token) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/api/favorites?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.ok) {
          // Transformar la estructura { id, producto: {...} } a Post[]
          const mappedPosts: Post[] = data.favorites.map((fav: any) => {
             const p = fav.producto;
             return {
               id: p.id,
               nombre: p.nombre,
               descripcion: p.descripcion,
               precioActual: Number(p.precioActual),
               cantidad: p.cantidad,
               categoria: p.categoria?.nombre,
               estado: p.estado?.nombre,
               fechaAgregado: p.fechaAgregado, // O fav.fecha si quieres la fecha que le dio like
               vendedor: p.vendedor,
               imagenes: p.imagenes?.map((img: any) => ({ 
                 id: img.id, 
                 url: img.urlImagen 
               })) || []
             };
          });
          setPosts(mappedPosts);
        }
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  // Eliminar Favorito
  const handleRemove = async (productId: number) => {
    // Optimistic update
    setPosts(prev => prev.filter(p => p.id !== productId));
    
    try {
      await fetch(`${API_URL}/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error eliminando favorito", error);
    }
  };

  // Filtro local
  const filteredPosts = posts.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto scroll-smooth bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Heart className="text-red-500 fill-red-500" /> Mis Favoritos
             </h1>
             <p className="text-slate-500 text-sm">Productos que te han gustado ({posts.length})</p>
          </div>
          <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar en favoritos..." 
               className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400 h-8 w-8" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={32} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes favoritos</h2>
            <p className="text-slate-500 max-w-xs mx-auto mb-8">Guarda productos para verlos aquí.</p>
            <button onClick={() => navigate('/home')} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
              Explorar Marketplace <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {filteredPosts.map((post) => (
                <motion.div 
                  key={post.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <ItemCard post={post} onClick={setSelectedPost} onRemove={handleRemove} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ProductDetailModal 
        open={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost} 
        onRemoveFavorite={handleRemove}
      />
    </div>
  );
}