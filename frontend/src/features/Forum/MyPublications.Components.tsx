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
        className={`transition-all duration-300 border-border bg-card group ${
          isEditing ? "ring-2 ring-primary/20 border-primary shadow-md" : "hover:shadow-md"
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
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {post.visto ? (
                      <span className="flex items-center gap-1"><LuEye className="w-3 h-3" /> Visto</span>
                    ) : (
                      "Nuevo"
                    )}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <LuCalendar className="w-3 h-3" /> {formattedDate}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 leading-snug">{post.titulo}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {post.cuerpo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:flex-col sm:border-l sm:pl-4 sm:border-border self-start shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditStart}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
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
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
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
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <h3 className="font-semibold text-primary flex items-center gap-2 text-sm">
                  <LuPencil className="w-4 h-4" /> Editando Publicación
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Título</label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-background font-medium border-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Contenido</label>
                  <Textarea
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-background min-h-[100px] resize-none border-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEditCancel}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSave({ id: post.id, titulo, cuerpo })}
                  disabled={isProcessing || !titulo.trim() || !cuerpo.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
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
      <div key={i} className="p-6 border border-border rounded-xl bg-card space-y-3 shadow-sm">
        <div className="flex justify-between gap-4">
          <div className="space-y-3 w-full">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full bg-muted" />
              <Skeleton className="h-5 w-32 rounded-full bg-muted" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded bg-muted" />
            <Skeleton className="h-4 w-full rounded bg-muted/50" />
          </div>
          <div className="flex flex-col gap-2 border-l border-border pl-4">
            <Skeleton className="h-8 w-8 rounded bg-muted" />
            <Skeleton className="h-8 w-8 rounded bg-muted" />
          </div>
        </div>
      </div>
    ))}
  </div>
);