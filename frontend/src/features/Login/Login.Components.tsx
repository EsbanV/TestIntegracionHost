import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";

// Magic UI
import { SparklesText } from "@/components/ui/sparkles-text";
import { MagicCard } from "@/components/ui/magic-card";
import { ShinyButton } from "@/components/ui/shiny-button";

// --- HEADER ---
export const LoginHeader = () => (
  <div className="relative p-8 pb-3 text-center overflow-hidden">
    {/* Halo suave detrás del ícono */}
    <div className="pointer-events-none absolute -top-10 left-1/2 h-32 w-56 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

    <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-blue-600 shadow-lg shadow-blue-600/40">
      <ShieldCheck className="h-9 w-9 text-white" />
    </div>

    <SparklesText className="mb-1 block text-3xl font-extrabold tracking-tight text-slate-900">
      MarketUCT
    </SparklesText>

    <p className="text-sm font-medium text-slate-500">
      Comunidad exclusiva universitaria
    </p>
  </div>
);

// --- FOOTER ---
export const LoginFooter = () => (
  <div className="bg-slate-50/60 p-4 border-t border-slate-200/60">
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-xs font-medium text-slate-400">
        © {new Date().getFullYear()} MarketUCT • Compra y vende seguro
      </p>

      {/* CTA visual usando Magic UI */}
      <ShinyButton className="rounded-full px-4 py-1 text-[11px] font-medium">
        Ver normas de la comunidad
      </ShinyButton>
    </div>
  </div>
);

// --- GOOGLE AREA ---
interface GoogleAreaProps {
  googleButtonRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string | null;
}

export const LoginGoogleArea = ({
  googleButtonRef,
  isLoading,
  error,
}: GoogleAreaProps) => (
  <MagicCard
    className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 pt-8 shadow-xl shadow-slate-200/60 backdrop-blur-sm"
    gradientColor="#1d4ed8"
    gradientFrom="#1d4ed8"
    gradientTo="#38bdf8"
  >
    {/* Botón Google */}
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex w-full min-h-[50px] justify-center">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-white/85">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        )}
        <div
          ref={googleButtonRef}
          className="overflow-hidden rounded-full shadow-md"
        />
      </div>
    </div>

    {/* Dominios permitidos */}
    <div className="mt-8 text-center">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Dominios permitidos
      </p>
      <div className="flex justify-center gap-2 text-xs font-medium text-slate-600">
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          @alu.uct.cl
        </span>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          @uct.cl
        </span>
      </div>
    </div>

    {/* Mensaje de Error */}
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/90 p-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <p className="text-sm font-medium leading-tight text-red-700">
            {error}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </MagicCard>
);
