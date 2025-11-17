import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Icons
import {
  LuPencil, LuTrash2, LuSave, LuLoader, LuCalendar, LuEye
} from "react-icons/lu";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { Publication, UpdatePublicationData } from "./myPublications.types";

// --- TARJETA EDITABLE ---
interface EditableCardProps {
  post: Publication;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (data: UpdatePublicationData) => void;
  onDelete: () => void;
  isProcessing: boolean;
}

export const EditablePublicationCard = ({
  post,
  isEditing,
  onEditStart,
  onEditCancel,
  onSave,
  onDelete,
  isProcessing,
}: EditableCardProps) => {
  const [titulo, setTitulo] = useState(post.titulo);
  const [cuerpo, setCuerpo] = useState(post.cuerpo);

  // Reset form when editing is cancelled
  useEffect(() => {
    if (!isEditing) {
      setTitulo(post.titulo);
      setCuerpo(post.cuerpo);
    }
  }, [isEditing, post]);

  const dateObj = new Date(post.fecha);
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? format(dateObj, "d 'de' MMM, yyyy • HH:mm", { locale: es })
    : "Fecha desconocida";

  return (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }} 
        className="relative"
    >
      <Card
        className={`transition-all duration-300 border-slate-200 group ${
          isEditing ? "ring-2 ring-blue-100 border-blue-300 shadow-md" : "hover:shadow-md bg-white"
        }`}
      >
        <CardContent className="p-6">
          
          {!isEditing ? (
            // --- MODO VISTA ---
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={`${
                      post.visto
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {post.visto ? (
                      <span className="flex items-center gap-1"><LuEye className="w-3 h-3" /> Visto</span>
                    ) : (
                      "Nuevo"
                    )}
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <LuCalendar className="w-3 h-3" /> {formattedDate}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">{post.titulo}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                    {post.cuerpo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:flex-col sm:border-l sm:pl-4 sm:border-slate-100 self-start shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditStart}
                  disabled={isProcessing}
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8"
                  title="Editar"
                >
                  <LuPencil className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                      title="Eliminar"
                    >
                      {isProcessing ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuTrash2 className="w-4 h-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se borrará permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            // --- MODO EDICIÓN ---
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <h3 className="font-semibold text-blue-700 flex items-center gap-2 text-sm">
                  <LuPencil className="w-4 h-4" /> Editando Publicación
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Título</label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white font-medium border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contenido</label>
                  <Textarea
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white min-h-[100px] resize-none border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEditCancel}
                  disabled={isProcessing}
                  className="text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSave({ id: post.id, titulo, cuerpo })}
                  disabled={isProcessing || !titulo.trim() || !cuerpo.trim()}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {isProcessing ? <LuLoader className="w-3 h-3 animate-spin" /> : <LuSave className="w-3 h-3" />}
                  Guardar
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- SKELETON LOADING ---
export const MyPublicationsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 border border-slate-200 rounded-xl bg-white space-y-3 shadow-sm">
        <div className="flex justify-between gap-4">
          <div className="space-y-3 w-full">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
          <div className="flex flex-col gap-2 border-l border-slate-100 pl-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);