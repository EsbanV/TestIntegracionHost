// AdminTransactionsPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import { useAdminTransactions } from '@/hooks/admin.hooks';
import type { AdminTransactionListItem } from './admin.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [compradorId, setCompradorId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const pageSize = 10;

  const { data, isLoading } = useAdminTransactions({
    page,
    pageSize,
    compradorId: compradorId ? Number(compradorId) : undefined,
    vendedorId: vendedorId ? Number(vendedorId) : undefined,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <AdminLayout
      title="Transacciones"
      subtitle="Historial y estado de las transacciones del marketplace."
    >
      <AdminSectionCard
        title="Listado de transacciones"
        description="Revisa el flujo de compras y ventas."
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              ID comprador
            </label>
            <Input
              value={compradorId}
              onChange={(e) => {
                setCompradorId(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
              placeholder="Opcional"
            />
          </div>
          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              ID vendedor
            </label>
            <Input
              value={vendedorId}
              onChange={(e) => {
                setVendedorId(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
              placeholder="Opcional"
            />
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
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Producto
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Comprador
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Vendedor
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.transactions?.map((t: AdminTransactionListItem) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2 text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(t.fecha).toLocaleString('es-CL')}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {t.producto?.nombre || 'Sin nombre'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {t.comprador?.usuario || '-'}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {t.vendedor?.usuario || '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-700">
                      {t.precioTotal != null
                        ? `$${t.precioTotal.toLocaleString('es-CL')}`
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {t.estadoNombre || 'Sin estado'}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {(!data || data.transactions.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No se encontraron transacciones.
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
