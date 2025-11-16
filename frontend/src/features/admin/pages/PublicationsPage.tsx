import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { 
  AdminTable, 
  AdminModal, 
  AdminSearchInput, 
  StatusBadge,
  PageTransition 
} from '@/features/admin/components/AdminComponents'; // Archivo unificado
import { 
  useAdminUsers, 
  useAdminProducts, 
  useHideProduct, 
  useDeleteProduct,
  useUpdateUserRole, 
  useBanUser, 
  useDeleteUser 
} from '../hooks/useAdmin';
import type { AdminProduct } from '../types/adminProduct';
import { Button } from '@/components/ui/button'; // Botón base de Shadcn

export default function PublicationsPage() {
  const { products, loading, error, query, setQuery, refetch } = useAdminProducts('');
  const { hideProduct } = useHideProduct();
  const { deleteProduct } = useDeleteProduct();

  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);

  // Definición de columnas para la tabla nueva
  const columns = useMemo(() => [
    { key: 'title', title: 'Título' },
    { key: 'author', title: 'Autor' },
    { key: 'categoryName', title: 'Categoría' },
    { 
      key: 'price', 
      title: 'Precio', 
      render: (p: AdminProduct) => typeof p.price === 'number' 
        ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(p.price) 
        : '—' 
    },
    { 
      key: 'status', 
      title: 'Estado', 
      render: (p: AdminProduct) => (
        <StatusBadge 
          status={p.status === 'published' ? 'ok' : 'warn'} 
          label={p.status ?? 'Desconocido'} 
        />
      ) 
    },
    { 
      key: 'actions',
      title: 'Acciones',
      align: 'right',
      render: (p: AdminProduct) => (
        <div className="flex justify-end gap-2">
           <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onHide(p.id); }}>
             Ocultar
           </Button>
           <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}>
             Eliminar
           </Button>
        </div>
      ),
    },
  ], []);

  const onHide = async (id: string) => {
    setSaving(true);
    try { await hideProduct(id); await refetch(); } 
    catch (err) { alert('Error al ocultar'); } 
    finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente?')) return;
    try { await deleteProduct(id); await refetch(); } 
    catch (err) { alert('Error al eliminar'); }
  };

  return (
    <AdminLayout title="Gestión de Publicaciones">
      <PageTransition>
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <AdminSearchInput 
            value={query} 
            onChange={setQuery} 
            placeholder="Buscar por título, autor..." 
          />
          <Button onClick={() => refetch()} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>

        {error && <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-md">Error: {error}</div>}

        <AdminTable
          columns={columns}
          data={products}
          loading={loading}
          rowKey={(p) => p.id}
          onRowClick={setSelected}
        />

        {/* Modal de Detalles */}
        <AdminModal
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle de Publicación"
          description={`ID: ${selected?.id}`}
          maxWidth="max-w-2xl"
          // Botones del footer del modal
          onSave={() => selected && onHide(selected.id)}
          saveLabel="Ocultar Publicación"
        >
          {selected && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Título:</span>
                <span className="col-span-3">{selected.title}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Autor:</span>
                <span className="col-span-3">{selected.author}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Precio:</span>
                <span className="col-span-3 text-emerald-600 font-bold">
                  ${selected.price}
                </span>
              </div>
              {/* Botón extra de peligro dentro del modal */}
              <div className="pt-4 border-t mt-4 flex justify-end">
                 <Button variant="destructive" onClick={() => { onDelete(selected.id); setSelected(null); }}>
                   Eliminar permanentemente
                 </Button>
              </div>
            </div>
          )}
        </AdminModal>
      </PageTransition>
    </AdminLayout>
  );
}