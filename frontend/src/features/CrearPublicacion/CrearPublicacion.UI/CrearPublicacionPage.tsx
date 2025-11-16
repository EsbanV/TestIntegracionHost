import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, DollarSign, Tag, Package, FileText, 
  CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, MapPin 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/app/context/AuthContext';

// --- CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

const CATEGORY_MAP: Record<string, number> = {
  'Electrónicos': 1,
  'Libros y Materiales': 2,
  'Muebles': 3,
  'Ropa': 4,
  'Otros': 5
};

const CAMPUS_OPTIONS = ["San Francisco", "San Juan Pablo II", "Norte"];

// --- UTILIDADES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- COMPONENTES UI ---
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5", className)}>
    {children}
  </label>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all resize-y disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 disabled:opacity-60 appearance-none cursor-pointer transition-all",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1L5 5L9 1" />
      </svg>
    </div>
  </div>
));
Select.displayName = "Select";

// --- COMPONENTE PRINCIPAL ---
export default function CreateProductPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string, isPromotion: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    precio: '',
    stock: '1',
    categoria: '',
    campus: '',
    descripcion: ''
  });

  const [images, setImages] = useState<File[]>([]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (images.length + newImages.length > 5) {
        setError("Máximo 5 imágenes permitidas");
        return;
      }
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.titulo || !formData.precio || !formData.categoria) {
      setError("Completa los campos obligatorios (Título, Precio, Categoría)");
      setIsLoading(false);
      return;
    }
    if (images.length === 0) {
      setError("Sube al menos una imagen");
      setIsLoading(false);
      return;
    }

    try {
      const base64Images = await Promise.all(images.map(file => convertFileToBase64(file)));

      const payload = {
        nombre: formData.titulo,
        descripcion: formData.descripcion,
        precioActual: parseFloat(formData.precio),
        precioAnterior: null,
        categoriaId: CATEGORY_MAP[formData.categoria] || 1,
        cantidad: parseInt(formData.stock) || 1,
        // Valores por defecto para campos eliminados visualmente pero requeridos por BD
        estadoProducto: 'usado', 
        informacionTecnica: formData.campus ? `Ubicación: ${formData.campus}` : '', 
        tiempoUso: '',
        imagenes: base64Images
      };

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.errors?.[0]?.msg || "Error al publicar");
      }

      setSuccess({
        message: "¡Producto publicado con éxito!",
        isPromotion: data.roleChanged
      });

      setTimeout(() => {
        navigate('/marketplace');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vender Producto</h1>
          <p className="text-slate-500 mt-2">Publica tu artículo en el marketplace universitario.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              
              {/* Info Principal */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                   <FileText className="text-slate-400" size={20} />
                   <h2 className="text-lg font-semibold text-slate-800">Detalles Principales</h2>
                </div>
                
                <div>
                   <Label>Título</Label>
                   <Input 
                     name="titulo" 
                     placeholder="Ej: Calculadora Casio fx-570" 
                     value={formData.titulo} 
                     onChange={handleChange}
                     disabled={isLoading}
                   />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label>Precio (CLP)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input 
                        name="precio" 
                        type="number" 
                        placeholder="5000" 
                        className="pl-9" 
                        value={formData.precio} 
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Stock Disponible</Label>
                    <div className="relative">
                       <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                       <Input 
                          name="stock" 
                          type="number" 
                          placeholder="1" 
                          className="pl-9" 
                          value={formData.stock}
                          onChange={handleChange}
                          disabled={isLoading}
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles Adicionales */}
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                   <Tag className="text-slate-400" size={20} />
                   <h2 className="text-lg font-semibold text-slate-800">Categorización</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label>Categoría</Label>
                    <Select name="categoria" value={formData.categoria} onChange={handleChange} disabled={isLoading}>
                      <option value="">Seleccionar...</option>
                      {Object.keys(CATEGORY_MAP).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Campus de Entrega</Label>
                    <div className="relative">
                      <Select name="campus" value={formData.campus} onChange={handleChange} disabled={isLoading} className="pl-10">
                          <option value="">Cualquiera</option>
                          {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea 
                    name="descripcion" 
                    placeholder="Describe el estado del producto, detalles importantes o motivos de venta..." 
                    value={formData.descripcion}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <div className="flex justify-end mt-1">
                     <span className={cn("text-xs font-medium", formData.descripcion.length > 900 ? "text-amber-500" : "text-slate-400")}>
                        {formData.descripcion.length}/1000
                     </span>
                  </div>
                </div>
              </div>

            </form>
          </motion.div>

          {/* Panel Lateral: Imágenes */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-blue-600" /> Galería
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {images.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-white/90 text-slate-600 p-1 rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                      disabled={isLoading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className={cn(
                      "aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all group", 
                      isLoading && "opacity-50 cursor-not-allowed"
                  )}>
                    <div className="p-3 bg-slate-50 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                       <Upload className="text-slate-400 group-hover:text-blue-500" size={20} />
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Subir Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isLoading} multiple />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-400 text-center">
                 Soporta JPG, PNG. Máx 5MB por foto.
              </p>

              <div className="mt-8 space-y-3">
                  <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Publicar Ahora"}
                  </button>
                  <button
                      onClick={() => navigate(-1)}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-800 transition-all"
                  >
                      Cancelar
                  </button>
              </div>

              {/* Feedback Messages */}
              <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl border border-red-100 flex gap-2"
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-100 flex gap-2 items-center"
                    >
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      <span>{success.message}</span>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}