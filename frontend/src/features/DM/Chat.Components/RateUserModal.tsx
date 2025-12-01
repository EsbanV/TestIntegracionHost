import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from "@/components/ui/button"; 

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/rate/${sellerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ puntuacion: rating, comentario: comment })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        if (data.message?.includes('comprar algo primero')) {
          setError("Aún no tienes una compra registrada con este usuario.");
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-foreground">Calificar a {sellerName}</h3>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {success ? (
                <div className="text-center py-8">
                   <div className="w-16 h-16 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Star className="fill-current" size={32} />
                   </div>
                   <h4 className="text-xl font-bold text-foreground">¡Gracias!</h4>
                   <p className="text-muted-foreground">Tu opinión ha sido registrada.</p>
                </div>
              ) : (
                <>
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
                            className={`${star <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} transition-colors`} 
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {rating === 0 ? "Toca para calificar" : rating === 5 ? "¡Excelente!" : rating >= 3 ? "Bueno" : "Malo"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Tu experiencia (Opcional)</label>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-24 text-foreground placeholder:text-muted-foreground"
                      placeholder="¿Qué tal fue la compra? ¿Recomiendas a este vendedor?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex gap-2 border border-destructive/20">
                      <span className="font-bold">Error:</span> {error}
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="w-full">Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={rating === 0 || isLoading} className="w-full">
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