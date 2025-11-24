import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, Loader2, Image as ImageIcon, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILIDADES UI ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTES BÁSICOS DE FORMULARIO ---

export const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5", className)}>
    {children}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
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

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
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

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
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

// --- COMPONENTE DE GALERÍA DE IMÁGENES ---

interface ImageGalleryProps {
  images: File[];
  isLoading: boolean;
  onRemove: (index: number) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageGalleryPanel = ({ images, isLoading, onRemove, onUpload }: ImageGalleryProps) => (
  // CAMBIO: 'sticky top-6' solo en lg (desktop). En móvil fluye normal (relative).
  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative lg:sticky lg:top-6">
    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
      <ImageIcon size={20} className="text-blue-600" /> Galería
    </h2>
    
    {/* CAMBIO: Se mantiene grid-cols-2 que funciona bien en móvil,
        pero aseguramos gap-3 para que no se peguen */}
    <div className="grid grid-cols-2 gap-3 mb-4">
      {images.map((file, idx) => (
        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
          <button 
            type="button"
            onClick={() => onRemove(idx)}
            // CAMBIO: Opacidad ajustada para que en móvil (donde no hay hover del mouse) sea más fácil interactuar si se necesita
            className="absolute top-1.5 right-1.5 bg-white/90 text-slate-600 p-1 rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:scale-90 lg:group-hover:scale-100"
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
          <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wide text-center px-2">Subir Foto</span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={isLoading} multiple />
        </label>
      )}
    </div>
    <p className="text-xs text-slate-400 text-center">
        Soporta JPG, PNG. Máx 5MB por foto.
    </p>
  </div>
);

// --- MENSAJES DE FEEDBACK ---

export const FeedbackMessages = ({ error, success }: { error: string | null, success: { message: string, isPromotion: boolean } | null }) => (
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
          className="mt-4 bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-100 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2">
             <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
             <span>{success.message}</span>
          </div>
          {success.isPromotion && (
             <p className="text-[10px] font-normal text-emerald-600 pl-6">
               🎉 ¡Felicidades! Has sido ascendido a Vendedor.
             </p>
          )}
        </motion.div>
      )}
   </AnimatePresence>
);