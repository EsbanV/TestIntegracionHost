import { useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  PageTransition, 
  AdminTable, 
  AdminSearchInput, 
  StatusBadge, 
  AdminModal,
  StatCard 
} from '@/features/admin/components/AdminComponents';
import { 
  useAdminProducts, 
  useHideProduct, 
  useDeleteProduct 
} from '../hooks/useAdmin';
import type { AdminProduct } from '../types/adminProduct';

// UI Icons & Components
import { Button } from '@/components/ui/button';
import { 
  Package, Filter, Eye, EyeOff, Trash2, ExternalLink, ShoppingBag 
} from 'lucide-react';

export default function AdminProductsPage() {
  // 1. Hooks de Datos
  const { products, loading, query, setQuery, status, setStatus, refetch } = useAdminProducts('');
  const { mutate: hideProduct, isLoading: isHiding } = useHideProduct();
  const { mutate: deleteProduct, isLoading: isDeleting } = useDeleteProduct();

  // 2. Estados Locales para Filtros Extra y Modal
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);

  // 3. Lógica de Filtrado Avanzado (Cliente)
  // El hook ya filtra por Query y Status. Aquí añadimos Categoría.
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.categoryName === selectedCategory);
  }, [products, selectedCategory]);

  // Obtener categorías únicas para el dropdown
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.categoryName).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // 4. Definición de Columnas
  const columns = [
    {
      key: 'title',
      title: 'Producto',
      width: '30%',
      render: (p: AdminProduct) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
             <ShoppingBag className="text-slate-400 w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 line-clamp-1">{p.title}</span>
            <span className="text-xs text-slate-500">ID: {p.id}</span>
          </div>
        </div>
      )
    },
    {
      key: 'categoryName',
      title: 'Categoría',
      render: (p: AdminProduct) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
          {p.categoryName || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'author',
      title: 'Vendedor',
      render: (p: AdminProduct) => (
        <div className="text-sm text-slate-600">{p.author}</div>
      )
    },
    {
      key: 'price',
      title: 'Precio',
      render: (p: AdminProduct) => (
        <span className="font-bold text-emerald-600">
          {typeof p.price === 'number' 
            ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(p.price) 
            : '—'}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Estado',
      render: (p: AdminProduct) => (
        <StatusBadge 
          status={p.status === 'published' ? 'ok' : 'neutral'} 
          label={p.status === 'published' ? 'Visible' : 'Oculto'} 
        />
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      align: 'right' as const,
      render: (p: AdminProduct) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}>
          Gestionar
        </Button>
      )
    }
  ];

  // 5. Acciones (Handlers)
  const handleToggleVisibility = () => {
    if (!selectedProduct) return;
    hideProduct(selectedProduct.id, {
      onSuccess: () => {
        refetch();
        setSelectedProduct(null);
      }
    });
  };

  const handleDelete = () => {
    if (!selectedProduct || !confirm("¿Eliminar definitivamente este producto?")) return;
    deleteProduct(selectedProduct.id, {
      onSuccess: () => {
        refetch();
        setSelectedProduct(null);
      }
    });
  };

  return (
    <AdminLayout title="Inventario Global">
      <PageTransition>
        
        {/* --- BARRA DE HERRAMIENTAS Y FILTROS --- */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
          
          {/* Buscador */}
          <div className="w-full md:w-1/3">
             <AdminSearchInput 
               value={query} 
               onChange={setQuery} 
               placeholder="Buscar producto o vendedor..." 
             />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
             
             {/* Filtro de Estado (Backend) */}
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <Filter className="w-4 h-4 text-slate-500" />
                <select 
                  className="bg-transparent text-sm outline-none text-slate-700 cursor-pointer"
                  value={status || ''}
                  onChange={(e) => setStatus(e.target.value as any || undefined)}
                >
                  <option value="">Todos los estados</option>
                  <option value="published">Visibles</option>
                  <option value="hidden">Ocultos</option>
                </select>
             </div>

             {/* Filtro de Categoría (Cliente) */}
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <Package className="w-4 h-4 text-slate-500" />
                <select 
                  className="bg-transparent text-sm outline-none text-slate-700 cursor-pointer max-w-[150px]"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Todas las categorías</option>
                  {categories.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
             </div>

             <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
               {loading ? '...' : 'Refrescar'}
             </Button>
          </div>
        </div>

        {/* --- TABLA DE RESULTADOS --- */}
        <div className="mb-4 text-sm text-slate-500 font-medium">
           Mostrando {filteredProducts.length} productos
        </div>

        <AdminTable 
          columns={columns}
          data={filteredProducts}
          loading={loading}
          rowKey={(p) => p.id}
          onRowClick={setSelectedProduct}
          emptyContent={
            <div className="py-16 text-center flex flex-col items-center text-slate-400">
               <Package className="w-12 h-12 mb-2 opacity-20" />
               <p>No se encontraron productos con estos filtros.</p>
            </div>
          }
        />

        {/* --- MODAL DE GESTIÓN --- */}
        <AdminModal
          open={!!selectedProduct}
          onClose={() => !isHiding && !isDeleting && setSelectedProduct(null)}
          title="Gestionar Producto"
          description={`ID: ${selectedProduct?.id}`}
          // Usamos el modal solo como contenedor, los botones los ponemos manual para tener 2 acciones
          maxWidth="max-w-lg"
        >
           {selectedProduct && (
             <div className="space-y-6">
                {/* Resumen del Producto */}
                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="h-16 w-16 bg-white rounded-md border border-slate-200 flex items-center justify-center shrink-0">
                      <ShoppingBag className="text-slate-300" />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900">{selectedProduct.title}</h4>
                      <p className="text-sm text-slate-500">Vendedor: {selectedProduct.author}</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        {typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : 'Precio no disponible'}
                      </p>
                   </div>
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 gap-4">
                   <Button 
                     variant={selectedProduct.status === 'published' ? "outline" : "default"}
                     className="w-full gap-2"
                     onClick={handleToggleVisibility}
                     disabled={isHiding || isDeleting}
                   >
                     {selectedProduct.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     {selectedProduct.status === 'published' ? 'Ocultar del Catálogo' : 'Hacer Visible'}
                   </Button>

                   <Button 
                     variant="secondary" // Usar un estilo que indique enlace externo
                     className="w-full gap-2"
                     onClick={() => window.open(`/producto/${selectedProduct.id}`, '_blank')}
                   >
                     <ExternalLink className="w-4 h-4" /> Ver en Marketplace
                   </Button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <Button 
                     variant="destructive" 
                     className="w-full gap-2"
                     onClick={handleDelete}
                     disabled={isHiding || isDeleting}
                   >
                     <Trash2 className="w-4 h-4" /> Eliminar Permanentemente
                   </Button>
                   <p className="text-xs text-center text-red-400 mt-2">
                     Esta acción no se puede deshacer y eliminará todas las imágenes asociadas.
                   </p>
                </div>
             </div>
           )}
        </AdminModal>

      </PageTransition>
    </AdminLayout>
  );
}