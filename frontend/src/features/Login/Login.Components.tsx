import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

// --- HEADER ---
export const LoginHeader = () => (
  <div className="p-8 pb-0 text-center">
    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
      <ShieldCheck className="text-white w-9 h-9" />
    </div>
    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">MarketUCT</h1>
    <p className="text-slate-500 text-sm font-medium">
      Comunidad exclusiva universitaria
    </p>
  </div>
);

// --- FOOTER ---
export const LoginFooter = () => (
  <div className="bg-slate-50/50 p-4 text-center border-t border-slate-200/50">
    <p className="text-xs text-slate-400 font-medium">
      © {new Date().getFullYear()} MarketUCT • Compra y vende seguro
    </p>
  </div>
);

// --- GOOGLE AREA ---
interface GoogleAreaProps {
  googleButtonRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string | null;
}

export const LoginGoogleArea = ({ googleButtonRef, isLoading, error }: GoogleAreaProps) => (
  <div className="p-8 pt-8">
    {/* Botón Google */}
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full flex justify-center min-h-[50px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-full">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        )}
        <div ref={googleButtonRef} className="overflow-hidden rounded-full shadow-md" />
      </div>
    </div>

    <div className="mt-8 text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        Dominios permitidos
      </p>
      <div className="flex justify-center gap-2 text-xs font-medium text-slate-600">
        <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">@alu.uct.cl</span>
        <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">@uct.cl</span>
      </div>
    </div>

    {/* Mensaje de Error */}
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 bg-red-50/80 border border-red-100 rounded-xl p-3 flex items-start gap-3"
        >
          <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);