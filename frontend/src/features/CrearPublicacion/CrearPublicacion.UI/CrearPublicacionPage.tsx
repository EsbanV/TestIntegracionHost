import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreatePostForm } from './CrearPublicacion.Components/CreatePostForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LuCirclePlus } from "react-icons/lu";

export default function CrearPublicacionPage() {
  const title = useMemo(() => 'Crear Nueva Publicación', []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-8"
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <LuCirclePlus size={28} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">{title}</CardTitle>
              <CardDescription>Completa los datos para publicar tu producto o servicio</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          <CreatePostForm />
        </CardContent>
      </Card>
    </motion.div>
  );
}