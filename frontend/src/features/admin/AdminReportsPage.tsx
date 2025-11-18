// AdminReportsPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import { useAdminReports, useAdminLookups } from './admin.hooks';
import type { AdminReport } from './admin.types';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [estadoId, setEstadoId] = useState<number | undefined>(undefined);
  const [tipo, setTipo] = useState<'usuario' | 'producto' | 'todos'>(
    'todos',
  );
  const pageSize = 10;

  const { data: lookups } = useAdminLookups();
  const { data, isLoading } = useAdminReports({
    page,
    pageSize,
    estadoId,
    tipo,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <AdminLayout
      title="Reportes"
      subtitle="Gestión de reportes de usuarios y productos."
    >
      <AdminSectionCard
        title="Listado de reportes"
        description="Revisa los reportes pendientes y su estado actual."
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Tipo
            </label>
            <Select
              value={tipo}
              onValueChange={(value: any) => {
                setTipo(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="usuario">Usuarios</SelectItem>
                <SelectItem value="producto">Productos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Estado
            </label>
          <Select
  value={estadoId !== undefined ? String(estadoId) : 'all'}
  onValueChange={(value) => {
    if (value === 'all') setEstadoId(undefined);
    else setEstadoId(Number(value));
    setPage(1);
  }}
>
  <SelectTrigger className="h-9 text-xs">
    <SelectValue placeholder="Todos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todos</SelectItem>
    {lookups?.reportStatuses.map((st) => (
      <SelectItem key={st.id} value={String(st.id)}>
        {st.nombre}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Motivo
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Reportante
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Objetivo
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.reports?.map((r: AdminReport) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {r.motivo || 'Sin motivo'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {r.reportante
                        ? `@${r.reportante.usuario}`
                        : 'Sistema'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {r.producto
                        ? `Producto #${r.producto.id}`
                        : r.usuarioReportado
                        ? `Usuario @${r.usuarioReportado.usuario}`
                        : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                      >
                        {r.estado?.nombre || 'Pendiente'}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {(!data || data.reports.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No se encontraron reportes.
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
