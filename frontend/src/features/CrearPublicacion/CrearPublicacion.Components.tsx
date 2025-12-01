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

// ============================================================================
// 1. ÁTOMOS DE FORMULARIO (Inputs, Labels, Selects)
// ============================================================================

export const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2", className)}>
    {children}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed",
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
      "flex min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y disabled:opacity-60 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative group">
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60 appearance-none cursor-pointer transition-all hover:bg-muted/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1L5 5L9 1" />
      </svg>
    </div>
  </div>
));
Select.displayName = "Select";

// ============================================================================
// 2. GALERÍA DE IMÁGENES (Upload & Preview)
// ============================================================================

interface ImageGalleryProps {
  images: File[];
  isLoading: boolean;
  onRemove: (index: number) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageGalleryPanel = ({ images, isLoading, onRemove, onUpload }: ImageGalleryProps) => (
  <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm relative lg:sticky lg:top-6">
    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
      <div className="p-2 bg-primary/10 rounded-lg">
        <ImageIcon size={20} className="text-primary" />
      </div>
      Galería de Fotos
    </h2>
    
    <div className="grid grid-cols-2 gap-3 mb-4">
      {images.map((file, idx) => (
        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group shadow-sm bg-muted">
          <img 
            src={URL.createObjectURL(file)} 
            alt="preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <button 
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-2 right-2 bg-background/90 text-muted-foreground p-1.5 rounded-full hover:bg-destructive hover:text-destructive-foreground shadow-sm transition-all transform hover:scale-110 active:scale-95"
            disabled={isLoading}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      
      {images.length < 5 && (
        <label className={cn(
            "aspect-square rounded-xl border-2 border-dashed border-input bg-muted/20 hover:bg-muted/50 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-all group active:scale-95", 
            isLoading && "opacity-50 cursor-not-allowed"
        )}>
          <div className="p-3 bg-background rounded-full mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Upload className="text-muted-foreground group-hover:text-primary" size={20} />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide text-center px-2 group-hover:text-primary transition-colors">
            Subir Foto
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={isLoading} multiple />
        </label>
      )}
    </div>
    
    <div className="text-xs text-muted-foreground text-center bg-muted/30 py-2 rounded-lg border border-border/50">
        Formatos: JPG, PNG • Máx 5MB
    </div>
  </div>
);

// ============================================================================
// 3. MENSAJES DE FEEDBACK (Success / Error)
// ============================================================================

export const FeedbackMessages = ({ error, success }: { error: string | null, success: { message: string, isPromotion: boolean } | null }) => (
  <AnimatePresence>
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mt-4 bg-destructive/10 text-destructive text-xs font-medium p-4 rounded-xl border border-destructive/20 flex gap-3 items-start"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
          <span>{error}</span>
        </motion.div>
      )}
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mt-4 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold p-4 rounded-xl border border-green-500/20 flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
             <div className="p-1 bg-green-500/20 rounded-full">
               <CheckCircle2 size={16} className="shrink-0" />
             </div>
             <span className="text-sm">{success.message}</span>
          </div>
          {success.isPromotion && (
             <div className="pl-10 text-xs font-normal opacity-90">
               🎉 ¡Felicidades! Has desbloqueado el nivel de Vendedor.
             </div>
          )}
        </motion.div>
      )}
   </AnimatePresence>
);