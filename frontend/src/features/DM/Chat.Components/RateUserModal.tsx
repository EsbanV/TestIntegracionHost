import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

// UI Components (Estilo consistente con tu app) ?
const Button = ({ children, className, onClick, disabled, variant = 'primary' }: any) => {
  const base = "w-full py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200"
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

interface RateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: number;
  sellerName: string;
}

export default function RateUserModal({ isOpen, onClose, sellerId, sellerName }: RateUserModalProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      // Nota: Este endpoint requiere que exista una transacción previa en la BD
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/rate/${sellerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ puntuacion: rating, comentario: comment })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        // Manejo específico del error de transacción requerida
        if (data.message?.includes('comprar algo primero')) {
          setError("No puedes calificar: Aún no tienes una compra registrada con este usuario.");
        } else {
          setError(data.message || "Error al enviar calificación");
        }
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Calificar a {sellerName}</h3>
              <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {success ? (
                <div className="text-center py-8">
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Star className="fill-current" size={32} />
                   </div>
                   <h4 className="text-xl font-bold text-slate-900">¡Gracias!</h4>
                   <p className="text-slate-500">Tu opinión ha sido registrada.</p>
                </div>
              ) : (
                <>
                  {/* Selector de Estrellas */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="transition-transform hover:scale-110 focus:outline-none"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHover(star)}
                          onMouseLeave={() => setHover(rating)}
                        >
                          <Star 
                            size={36} 
                            className={`${star <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"} transition-colors`} 
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      {rating === 0 ? "Toca para calificar" : rating === 5 ? "¡Excelente!" : rating >= 3 ? "Bueno" : "Malo"}
                    </p>
                  </div>

                  {/* Comentario */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tu experiencia (Opcional)</label>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                      placeholder="¿Qué tal fue la compra? ¿Recomiendas a este vendedor?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex gap-2">
                      <span className="font-bold">Error:</span> {error}
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="pt-2 flex gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={rating === 0 || isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Calificación"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}