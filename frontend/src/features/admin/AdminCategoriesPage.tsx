// AdminCategoriesPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import {
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from './admin.hooks';
import type { AdminCategory } from './admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { data, isLoading } = useAdminCategories();
  const createMutation = useAdminCreateCategory();
  const updateMutation = useAdminUpdateCategory(0);
  const deleteMutation = useAdminDeleteCategory(0);

  // "none" = sin categoría padre
  const [nombre, setNombre] = useState('');
  const [padreId, setPadreId] = useState<string>('none');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [editingPadreId, setEditingPadreId] = useState<string>('none');

  const handleCreate = () => {
    if (!nombre.trim()) return;

    createMutation.mutate({
      nombre: nombre.trim(),
      categoriaPadreId: padreId === 'none' ? null : Number(padreId),
    });

    setNombre('');
    setPadreId('none');
  };

  const handleStartEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setEditingNombre(cat.nombre);
    setEditingPadreId(
      cat.categoriaPadreId ? String(cat.categoriaPadreId) : 'none',
    );
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    updateMutation.mutateAsync(
      {
        nombre: editingNombre,
        categoriaPadreId:
          editingPadreId === 'none' ? null : Number(editingPadreId),
      },
      {
        onMutate: () => {
          (updateMutation as any).options.mutationFn = (payload: any) =>
            (updateMutation as any).options.mutationFnOriginal?.(
              editingId,
              payload,
            );
        },
      } as any,
    );

    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutateAsync(undefined, {
      onMutate: () => {
        (deleteMutation as any).options.mutationFn = () =>
          (deleteMutation as any).options.mutationFnOriginal?.(id);
      },
    } as any);
  };

  return (
    <AdminLayout
      title="Categorías"
      subtitle="Gestión de categorías del marketplace."
    >
      <AdminSectionCard
        title="Crear nueva categoría"
        description="Puedes anidar categorías usando un padre opcional."
      >
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-full md:w-1/3">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Nombre
            </label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-9"
              placeholder="Ej: Electrónica"
            />
          </div>

          <div className="w-full md:w-1/3">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Categoría padre (opcional)
            </label>
            <Select value={padreId} onValueChange={(value) => setPadreId(value)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {data?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={handleCreate} className="mt-2">
            Crear categoría
          </Button>
        </div>
      </AdminSectionCard>

      <div className="mt-6">
        <AdminSectionCard
          title="Listado de categorías"
          description="Edita o elimina categorías existentes."
        >
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Nombre
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Padre
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {data?.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-3 py-2 text-[11px] text-slate-800">
                        {editingId === cat.id ? (
                          <Input
                            value={editingNombre}
                            onChange={(e) =>
                              setEditingNombre(e.target.value)
                            }
                            className="h-7 text-[11px]"
                          />
                        ) : (
                          cat.nombre
                        )}
                      </td>

                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {editingId === cat.id ? (
                          <Select
                            value={editingPadreId}
                            onValueChange={(value) =>
                              setEditingPadreId(value)
                            }
                          >
                            <SelectTrigger className="h-7 text-[11px]">
                              <SelectValue placeholder="Ninguna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ninguna</SelectItem>
                              {data
                                ?.filter((c) => c.id !== cat.id)
                                .map((c) => (
                                  <SelectItem
                                    value={String(c.id)}
                                    key={c.id}
                                  >
                                    {c.nombre}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          data?.find(
                            (p) => p.id === cat.categoriaPadreId,
                          )?.nombre || '-'
                        )}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {editingId === cat.id ? (
                          <div className="flex justify-center gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={handleSaveEdit}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleStartEdit(cat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(cat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {(!data || data.length === 0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-xs text-slate-500 italic"
                      >
                        No hay categorías registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </AdminLayout>
  );
}
