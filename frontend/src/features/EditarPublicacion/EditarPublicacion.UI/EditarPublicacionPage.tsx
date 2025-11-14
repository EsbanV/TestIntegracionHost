import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { EditarPostForm } from './EditarPublicacion.Components/EditarPostForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LuPencil } from "react-icons/lu";

export default function EditarPublicacionPage() {
  const title = useMemo(() => 'Editar Publicación', []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-8"
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-full text-amber-600">
              <LuPencil size={28} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">{title}</CardTitle>
              <CardDescription>Modifica los detalles de tu publicación existente</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          <EditarPostForm />
        </CardContent>
      </Card>
    </motion.div>
  );
}