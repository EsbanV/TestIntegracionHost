// AdminProductsPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import {
  useAdminProducts,
  useAdminLookups,
  useAdminToggleProductVisibility,
} from './admin.hooks';
import type { AdminProductListItem } from './admin.types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff } from 'lucide-react';

// -----------------------------------------------------------
// Fila de producto: maneja el toggle de visibilidad por fila
// -----------------------------------------------------------

interface ProductRowProps {
  product: AdminProductListItem;
}

const ProductRow: React.FC<ProductRowProps> = ({ product }) => {
  const toggleVisibilityMutation = useAdminToggleProductVisibility(product.id);

  const handleToggleVisibility = () => {
    toggleVisibilityMutation.mutate();
  };

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
      {/* Producto + ID */}
      <td className="px-3 py-2">
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">{product.title}</span>
          <span className="text-[11px] text-slate-500">#{product.id}</span>
        </div>
      </td>

      {/* Vendedor */}
      <td className="px-3 py-2 text-[11px] text-slate-600">
        {product.author}
      </td>

      {/* Categoría */}
      <td className="px-3 py-2 text-[11px] text-slate-600">
        {product.categoryName || '-'}
      </td>

      {/* Precio */}
      <td className="px-3 py-2 text-right text-[11px] text-slate-700">
        {product.price != null
          ? `$${product.price.toLocaleString('es-CL')}`
          : '-'}
      </td>

      {/* Estado negocio (nuevo/usado, etc.) */}
      <td className="px-3 py-2 text-center">
        <Badge variant="outline" className="text-[10px]">
          {product.estadoNombre || 'Activo'}
        </Badge>
      </td>

      {/* Visibilidad en el Marketplace */}
      <td className="px-3 py-2 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={product.visible ? 'Ocultar publicación' : 'Mostrar publicación'}
          onClick={handleToggleVisibility}
          disabled={toggleVisibilityMutation.isPending}
        >
          {product.visible ? (
            <Eye className="h-4 w-4 text-slate-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-slate-400" />
          )}
        </Button>
        <div className="mt-1 text-[10px] text-slate-500">
          {product.visible ? 'Visible' : 'Oculta'}
        </div>
      </td>
    </tr>
  );
};

// -----------------------------------------------------------
// Página principal de productos
// -----------------------------------------------------------

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [estadoId, setEstadoId] = useState<number | undefined>(undefined);
  const [categoriaId, setCategoriaId] = useState<number | undefined>(
    undefined,
  );

  const pageSize = 10;

  const { data: lookups } = useAdminLookups();
  const { data, isLoading } = useAdminProducts({
    q: q || undefined,
    estadoId,
    categoriaId,
    page,
    pageSize,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <AdminLayout
      title="Productos"
      subtitle="Moderación y gestión de publicaciones de productos."
    >
      <AdminSectionCard
        title="Listado de productos"
        description="Revisa el inventario activo, estados y visibilidad."
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Buscar
            </label>
            <Input
              placeholder="Nombre o descripción..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-9"
            />
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
                {lookups?.productStatuses.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)}>
                    {st.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Categoría
            </label>
            <Select
              value={categoriaId !== undefined ? String(categoriaId) : 'all'}
              onValueChange={(value) => {
                if (value === 'all') setCategoriaId(undefined);
                else setCategoriaId(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {lookups?.categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.nombre}
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
                    Producto
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Vendedor
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Categoría
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">
                    Precio
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Visibilidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.products?.map((p: AdminProductListItem) => (
                  <ProductRow key={p.id} product={p} />
                ))}

                {(!data || data.products.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No se encontraron productos con los filtros actuales.
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
