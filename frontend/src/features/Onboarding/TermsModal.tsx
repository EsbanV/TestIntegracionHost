import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal = ({ isOpen, onClose, onAccept }: TermsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop oscuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Contenido del Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                    <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Términos y Condiciones</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo Scrollable */}
            <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4 leading-relaxed bg-slate-50/50">
              <p><strong className="text-slate-800">1. Uso de la Plataforma:</strong> Esta aplicación es exclusiva para miembros de la comunidad universitaria. Al registrarte, te comprometes a proporcionar información verídica.</p>
              <p><strong className="text-slate-800">2. Conducta:</strong> Se prohíbe estrictamente el lenguaje ofensivo, acoso o publicación de contenido ilegal. El incumplimiento resultará en la suspensión inmediata de la cuenta.</p>
              <p><strong className="text-slate-800">3. Privacidad de Datos:</strong> Tu número telefónico y correo serán visibles para otros usuarios únicamente con el fin de coordinar transacciones dentro del campus.</p>
              <p><strong className="text-slate-800">4. Responsabilidad:</strong> La plataforma actúa como intermediario de contacto. No nos hacemos responsables por el estado de los productos o el cumplimiento de los pagos entre estudiantes.</p>
              <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-200">Última actualización: Noviembre 2024</p>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm">
                Cerrar
              </button>
              <button 
                onClick={() => { onAccept(); onClose(); }} 
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm active:scale-95"
              >
                Aceptar todo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};