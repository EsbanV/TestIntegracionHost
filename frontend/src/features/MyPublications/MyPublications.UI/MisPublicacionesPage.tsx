import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Edit3, Trash2, PlusCircle, Search, 
  MoreVertical, AlertTriangle, X, Check, Loader2,
  Eye, EyeOff, ShoppingBag
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/app/context/AuthContext';

// --- Configuración ---
const API_URL = import.meta.env.VITE_API_URL;

// --- Utilidades ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

// --- Tipos ---
interface Product {
  id: number;
  nombre: string;
  descripcion?: string;
  precioActual: number;
  cantidad: number;
  categoria?: string;
  estado?: string;
  visible: boolean;
  fechaAgregado: string;
  imagenes: { id: number; urlImagen: string }[];
}

// --- COMPONENTES UI ---

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default'|'success'|'warning'|'outline' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-50 text-green-700 border border-green-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    outline: "border border-slate-200 text-slate-600"
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", variants[variant])}>
      {children}
    </span>
  );
};

const Button = ({ children, className, variant = 'primary', size = 'default', loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'danger'|'ghost', size?: 'sm'|'default'|'icon', loading?: boolean }) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "hover:bg-slate-100 text-slate-600",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2 text-sm",
    icon: "h-9 w-9 p-0 flex items-center justify-center",
  };
  return (
    <button 
      className={cn("inline-flex items-center justify-center rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

// --- COMPONENTE: TARJETA DE PRODUCTO ---
const ProductCard = ({ product, onEdit, onDelete, onToggleVisibility }: { product: Product, onEdit: (p: Product) => void, onDelete: (id: number) => void, onToggleVisibility: (id: number, visible: boolean) => void }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 border-b border-slate-100">
        {product.imagenes?.[0]?.urlImagen ? (
          <img 
            src={product.imagenes[0].urlImagen} 
            alt={product.nombre} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ShoppingBag size={40} strokeWidth={1.5} />
          </div>
        )}
        
        {/* Overlay de estado */}
        <div className="absolute top-3 right-3 flex gap-2">
           <Badge variant={product.visible ? 'success' : 'warning'}>
             {product.visible ? 'Visible' : 'Oculto'}
           </Badge>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1">
          <h3 className="font-bold text-slate-900 line-clamp-1" title={product.nombre}>{product.nombre}</h3>
          <p className="text-xs text-slate-500">{product.categoria || 'Sin categoría'}</p>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
           <div>
             <p className="text-xs text-slate-400 mb-0.5">Precio</p>
             <p className="font-bold text-slate-900">{formatCLP(product.precioActual)}</p>
           </div>
           <div className="text-right">
             <p className="text-xs text-slate-400 mb-0.5">Stock</p>
             <p className="text-sm font-medium text-slate-700">{product.cantidad}</p>
           </div>
        </div>
      </div>

      {/* Acciones (Hover) */}
      <div className="absolute inset-x-0 bottom-0 bg-white/90 p-3 backdrop-blur-sm border-t border-slate-100 translate-y-full transition-transform duration-200 group-hover:translate-y-0 flex gap-2 justify-center">
        <Button size="sm" variant="secondary" onClick={() => onEdit(product)} title="Editar">
          <Edit3 size={16} />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onToggleVisibility(product.id, !product.visible)} title={product.visible ? "Ocultar" : "Mostrar"}>
          {product.visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(product.id)} title="Eliminar">
          <Trash2 size={16} />
        </Button>
      </div>
    </motion.div>
  );
};

// --- MODAL DE EDICIÓN ---
const EditModal = ({ product, isOpen, onClose, onSave }: { product: Product | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<Product>) => void }) => {
  const [formData, setFormData] = useState(product || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (product) setFormData(product); }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Editar Producto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
            <input name="nombre" value={formData.nombre} onChange={handleChange} className="w-full rounded-lg border-slate-200 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Precio</label>
                <input type="number" name="precioActual" value={formData.precioActual} onChange={handleChange} className="w-full rounded-lg border-slate-200 text-sm" />
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stock</label>
                <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} className="w-full rounded-lg border-slate-200 text-sm" />
             </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className="w-full rounded-lg border-slate-200 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>Guardar Cambios</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---

export default function MyProductsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Cargar Productos
  const fetchMyProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/products/my-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setProducts(data.products);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyProducts();
  }, [token]);

  // Filtrado Local
  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Acciones
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`${API_URL}/api/products/${deletingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(prev => prev.filter(p => p.id !== deletingId));
      setDeletingId(null);
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  const handleUpdate = async (data: Partial<Product>) => {
    if (!editingProduct) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchMyProducts(); // Recargar para asegurar datos frescos
      }
    } catch (error) {
      console.error("Error actualizando:", error);
    }
  };

  const handleVisibility = async (id: number, visible: boolean) => {
    try {
      // Actualización Optimista
      setProducts(prev => prev.map(p => p.id === id ? { ...p, visible } : p));
      
      await fetch(`${API_URL}/api/products/${id}/visibility`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ visible })
      });
    } catch (error) {
      fetchMyProducts(); // Revertir si falla
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Publicaciones</h1>
            <p className="text-slate-500 text-sm">Gestiona tu inventario y ventas</p>
          </div>
          <Button onClick={() => navigate('/crear')} className="gap-2 shadow-blue-100 shadow-lg">
             <PlusCircle size={18} /> Nueva Publicación
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           <input 
             type="text" 
             placeholder="Buscar en mis productos..." 
             className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
             <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Package className="text-slate-300 h-8 w-8" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">No tienes productos</h3>
             <p className="text-slate-500 text-sm mt-1 mb-6">Comienza a vender hoy mismo.</p>
             <Button onClick={() => navigate('/crear')}>Crear el primero</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onEdit={setEditingProduct} 
                  onDelete={setDeletingId}
                  onToggleVisibility={handleVisibility}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal Editar */}
      <EditModal 
        isOpen={!!editingProduct} 
        product={editingProduct} 
        onClose={() => setEditingProduct(null)} 
        onSave={handleUpdate} 
      />

      {/* Modal Confirmar Borrar */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-600 mx-auto">
                 <AlertTriangle size={24} />
              </div>
              <h3 className="text-center font-bold text-lg mb-2">¿Estás seguro?</h3>
              <p className="text-center text-slate-500 text-sm mb-6">Esta acción no se puede deshacer. El producto será eliminado permanentemente.</p>
              <div className="flex gap-3">
                 <Button variant="secondary" className="flex-1" onClick={() => setDeletingId(null)}>Cancelar</Button>
                 <Button variant="danger" className="flex-1" onClick={handleDelete}>Eliminar</Button>
              </div>
           </motion.div>
        </div>
      )}

    </div>
  );
}