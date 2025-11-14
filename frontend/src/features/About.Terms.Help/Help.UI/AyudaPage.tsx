import React from "react";
import { motion } from "framer-motion";
import FAQ from "./Help.Components/FAQ";
import ChatBox from "./Help.Components/ChatBox";
import { Badge } from "@/components/ui/badge"; // Shadcn
import { LifeBuoy } from "lucide-react";

export default function AyudaPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto py-8 space-y-8"
    >
      {/* Encabezado de Sección */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <LifeBuoy className="text-blue-600 h-8 w-8" />
            Centro de Ayuda
          </h1>
          <p className="text-slate-500 mt-2">
            Encuentra respuestas rápidas o chatea con nuestro soporte.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm border-blue-200 text-blue-700 bg-blue-50">
          Soporte 24/7
        </Badge>
      </div>

      {/* Contenido Principal */}
      <div className="space-y-8">
        
        {/* Sección de Preguntas Frecuentes */}
        <section>
          <FAQ />
        </section>

        {/* Sección de Chat de Soporte */}
        <section className="pt-4">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">¿Aún necesitas ayuda?</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <ChatBox />
          </div>
        </section>

      </div>
    </motion.div>
  );
}