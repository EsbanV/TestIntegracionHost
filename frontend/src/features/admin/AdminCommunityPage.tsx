// AdminCommunityPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import {
  useAdminCommunityMessages,
  useAdminDeleteCommunityMessage,
} from './admin.hooks';
import type { AdminCommunityMessage } from './admin.types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';

export default function AdminCommunityPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useAdminCommunityMessages({
    page,
    pageSize,
  });

  const deleteMutation = useAdminDeleteCommunityMessage(0); // ver nota como en productos
  const totalPages = data?.totalPages ?? 1;

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
      title="Comunidad"
      subtitle="Mensajes globales o broadcast de la comunidad."
    >
      <AdminSectionCard
        title="Mensajes de comunidad"
        description="Supervisa y elimina mensajes inapropiados."
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
                    Usuario
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Mensaje
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.messages?.map((m: AdminCommunityMessage) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      @{m.usuario?.usuario}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-800 max-w-xs truncate">
                      {m.mensaje}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(m.fechaEnvio).toLocaleString('es-CL')}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {(!data || data.messages.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No hay mensajes de comunidad.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </AdminSectionCard>
    </AdminLayout>
  );
}
