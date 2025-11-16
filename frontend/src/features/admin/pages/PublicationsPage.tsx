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
  useAdminProducts, 
  useHideProduct, 
  useDeleteProduct 
} from '../hooks/useAdmin';
import type { AdminProduct } from '../types/adminProduct';
import { Button } from '@/components/ui/button'; // Botón base de Shadcn

export default function PublicationsPage() {
  // Hook de lectura (lista de productos)
  const { products, loading, error, query, setQuery, refetch } = useAdminProducts('');
  
  // Hooks de escritura (Mutaciones)
  const { mutate: hideProduct, isLoading: isHiding } = useHideProduct();
  const { mutate: deleteProduct, isLoading: isDeleting } = useDeleteProduct();

  // Estados locales
  const [selected, setSelected] = useState<AdminProduct | null>(null);

  // --- Definición de columnas para la tabla ---
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
          label={p.status === 'published' ? 'Publicado' : 'Oculto'} 
        />
      ) 
    },
    { 
      key: 'actions',
      title: 'Acciones',
      align: 'right',
      render: (p: AdminProduct) => (
        <div className="flex justify-end gap-2">
           {/* Botón Ocultar/Mostrar */}
           <Button 
             variant="outline" 
             size="sm" 
             onClick={(e) => { e.stopPropagation(); onHide(p); }}
             disabled={isHiding}
           >
             {p.status === 'published' ? 'Ocultar' : 'Mostrar'}
           </Button>
           
           {/* Botón Eliminar */}
           <Button 
             variant="destructive" 
             size="sm" 
             onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
             disabled={isDeleting}
           >
             Eliminar
           </Button>
        </div>
      ),
    },
  ], [isHiding, isDeleting]); // Dependencias para refrescar botones si cambia estado

  // --- Handlers de Acción ---

  const onHide = (product: AdminProduct) => {
    // Si llamamos desde la tabla, no hay 'selected', así que usamos el argumento directo
    // Si llamamos desde el modal, usamos 'selected'
    const idToHide = product?.id || selected?.id;
    if (!idToHide) return;

    hideProduct(idToHide, {
      onSuccess: () => {
        refetch(); // Recargar lista para ver el cambio de estado
        // No cerramos el modal automáticamente para que el admin vea el cambio, o podemos cerrarlo:
        if (selected) setSelected(null); 
      },
      onError: () => alert('Error al cambiar visibilidad de la publicación')
    });
  };

  const onDelete = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta publicación permanentemente? Esta acción no se puede deshacer.')) return;
    
    deleteProduct(id, {
      onSuccess: () => {
        refetch();
        setSelected(null);
      },
      onError: () => alert('Error al eliminar publicación')
    });
  };

  // --- Renderizado ---

  return (
    <AdminLayout title="Gestión de Publicaciones">
      <PageTransition>
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <AdminSearchInput 
            value={query} 
            onChange={setQuery} 
            placeholder="Buscar por título, autor o categoría..." 
          />
          <Button 
            onClick={() => refetch()} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Cargando...' : 'Actualizar Lista'}
          </Button>
        </div>

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-50 border border-red-200 rounded-md text-sm font-medium">
            Error al cargar datos: {error}
          </div>
        )}

        {/* Tabla Principal */}
        <AdminTable
          columns={columns}
          data={products}
          loading={loading}
          rowKey={(p) => p.id}
          onRowClick={setSelected}
          emptyContent={
            <div className="py-12 text-center text-slate-500">
              No se encontraron publicaciones que coincidan con tu búsqueda.
            </div>
          }
        />

        {/* Modal de Detalles y Acciones */}
        <AdminModal
          open={!!selected}
          onClose={() => !isHiding && !isDeleting && setSelected(null)}
          title="Detalle de Publicación"
          description={`ID Referencia: ${selected?.id}`}
          maxWidth="max-w-2xl"
          
          // Botón Principal (Ocultar/Mostrar) en el pie del modal
          onSave={() => selected && onHide(selected)}
          isSaving={isHiding}
          saveLabel={selected?.status === 'hidden' ? 'Mostrar Publicación' : 'Ocultar Publicación'}
        >
          {selected && (
            <div className="grid gap-4 py-2">
              {/* Información Clave */}
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-slate-500 text-right text-sm uppercase">Título</span>
                <span className="col-span-3 font-medium text-slate-900">{selected.title}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-slate-500 text-right text-sm uppercase">Autor</span>
                <span className="col-span-3 text-slate-700">{selected.author}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-slate-500 text-right text-sm uppercase">Categoría</span>
                <span className="col-span-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {selected.categoryName || 'Sin categoría'}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-slate-500 text-right text-sm uppercase">Precio</span>
                <span className="col-span-3 text-emerald-600 font-bold text-lg">
                  ${selected.price}
                </span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-slate-500 text-right text-sm uppercase">Estado</span>
                <span className="col-span-3">
                  <StatusBadge 
                    status={selected.status === 'published' ? 'ok' : 'warn'} 
                    label={selected.status === 'published' ? 'Publicado (Visible)' : 'Oculto (No visible)'} 
                  />
                </span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-slate-500 text-right text-sm uppercase">Fecha</span>
                <span className="col-span-3 text-slate-600 text-sm">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>

              {/* Zona de Peligro dentro del Modal */}
              <div className="pt-6 border-t border-slate-100 mt-4 flex justify-between items-center">
                 <div className="text-xs text-slate-400 italic">
                   * Eliminar es una acción permanente.
                 </div>
                 <Button 
                   variant="destructive" 
                   onClick={() => onDelete(selected.id)}
                   disabled={isDeleting || isHiding}
                 >
                   {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
                 </Button>
              </div>
            </div>
          )}
        </AdminModal>
      </PageTransition>
    </AdminLayout>
  );
}