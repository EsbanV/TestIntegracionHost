import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, DollarSign, Tag, Package, FileText, 
  CheckCircle2, AlertCircle, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/app/context/AuthContext';

// --- CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

// Mapeo de categorías (Frontend String -> Backend ID)
// Asegúrate de que estos IDs coincidan con tu tabla 'Categorias' en la BD
const CATEGORY_MAP: Record<string, number> = {
  'Electrónicos': 1,
  'Libros y Materiales': 2,
  'Muebles': 3,
  'Ropa': 4,
  'Otros': 5
};

const CONDITIONS = ["Nuevo", "Usado", "Reacondicionado"];
const CAMPUS_OPTIONS = ["San Francisco", "San Juan Pablo II"];

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

// --- COMPONENTES UI (Estilo Shadcn) ---

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("block text-sm font-medium text-slate-700 mb-1.5", className)}>
    {children}
  </label>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
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
      "flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y",
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
        "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
));
Select.displayName = "Select";

// --- COMPONENTE PRINCIPAL ---

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Estados del Formulario
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string, isPromotion: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    precio: '',
    stock: '1',
    categoria: '',
    condicion: 'Usado',
    campus: '',
    descripcion: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Manejadores
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); // Limpiar error al escribir
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      // Validar máximo 5 imágenes
      if (images.length + newImages.length > 5) {
        setError("Máximo 5 imágenes permitidas");
        return;
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // 1. Validaciones Frontend
    if (!formData.titulo || !formData.precio || !formData.categoria) {
      setError("Por favor completa los campos obligatorios");
      setIsLoading(false);
      return;
    }
    if (images.length === 0) {
      setError("Debes subir al menos una imagen del producto");
      setIsLoading(false);
      return;
    }

    try {
      // 2. Convertir imágenes a Base64
      // Tu backend espera un array de strings base64 en 'imagenes'
      const base64Images = await Promise.all(images.map(file => convertFileToBase64(file)));

      // 3. Construir Payload
      const payload = {
        nombre: formData.titulo,
        descripcion: formData.descripcion,
        precioActual: parseFloat(formData.precio),
        precioAnterior: null, // Opcional
        categoriaId: CATEGORY_MAP[formData.categoria] || 1, // Default a 1 si falla
        cantidad: parseInt(formData.stock),
        estadoProducto: formData.condicion.toLowerCase(), // 'nuevo' o 'usado'
        // Tu backend maneja 'imagenes' como array de strings base64
        imagenes: base64Images, 
        // Opcionales que tu backend podría aceptar o ignorar según implementación
        informacionTecnica: `Etiquetas: ${tags.join(', ')}`, 
        tiempoUso: formData.condicion === 'Nuevo' ? '0 meses' : 'Desconocido'
      };

      // 4. Petición Fetch
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
        throw new Error(data.message || data.errors?.[0]?.msg || "Error al crear producto");
      }

      // 5. Éxito
      setSuccess({
        message: "Publicación creada exitosamente",
        isPromotion: data.roleChanged // Tu backend devuelve esto si el usuario subió de nivel
      });

      // Limpiar formulario o redirigir después de unos segundos
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vender un Producto</h1>
          <p className="text-slate-500 mt-2">Completa los detalles para publicar tu artículo en el marketplace.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: Formulario */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              
              {/* Sección: Información Básica */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={18} /> Información Básica
                </h2>
                
                <div className="grid gap-4">
                  <div>
                    <Label>Título de la publicación</Label>
                    <Input 
                      name="titulo" 
                      placeholder="Ej: Calculadora Científica Casio fx-570" 
                      value={formData.titulo} 
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Precio (CLP)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input 
                          name="precio" 
                          type="number" 
                          placeholder="10000" 
                          className="pl-9" 
                          value={formData.precio} 
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Stock</Label>
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
              </div>

              <div className="border-t border-slate-100 my-6" />

              {/* Sección: Detalles */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Tag size={18} /> Detalles y Categoría
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <Label>Condición</Label>
                    <Select name="condicion" value={formData.condicion} onChange={handleChange} disabled={isLoading}>
                      {CONDITIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                   <Label>Campus de Entrega (Opcional)</Label>
                   <Select name="campus" value={formData.campus} onChange={handleChange} disabled={isLoading}>
                      <option value="">Preferiblemente en...</option>
                      {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                   </Select>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea 
                    name="descripcion" 
                    placeholder="Describe el estado, tiempo de uso, y detalles importantes..." 
                    rows={5} 
                    value={formData.descripcion}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{formData.descripcion.length}/1000</p>
                </div>

                {/* Tags */}
                <div>
                  <Label>Etiquetas (Presiona Enter)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
                    {tags.map(tag => (
                      <span key={tag} className="bg-white text-slate-700 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      className="bg-transparent outline-none text-sm flex-1 min-w-[120px]" 
                      placeholder={tags.length === 0 ? "ej: calculo, apuntes..." : ""}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

            </form>
          </motion.div>

          {/* COLUMNA DERECHA: Imágenes y Resumen */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Card Subida Imágenes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <ImageIcon size={18} /> Imágenes
              </h2>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {images.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                      disabled={isLoading}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className={cn("aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all", isLoading && "opacity-50 cursor-not-allowed")}>
                    <Upload className="text-slate-400 mb-2" size={24} />
                    <span className="text-xs text-slate-500 font-medium">Subir Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isLoading} multiple />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-400">Máximo 5 imágenes. JPG o PNG.</p>
            </div>

            {/* Botones Acción */}
            <div className="space-y-3">
               <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2"
                    >
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl border border-emerald-100"
                    >
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <CheckCircle2 size={16} /> {success.message}
                      </div>
                      {success.isPromotion && (
                        <p className="text-xs text-emerald-700 pl-6">
                          🎉 ¡Felicidades! Has sido ascendido a Vendedor.
                        </p>
                      )}
                    </motion.div>
                  )}
               </AnimatePresence>

               <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Publicar Producto"}
               </button>
               <button
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all"
               >
                  Cancelar
               </button>
            </div>

          </motion.div>

        </div>
      </div>
    </div>
  );
}