import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Importar el NUEVO hook de productos (basado en useInfiniteQuery)
import { useProductos } from '@/features/Marketplace/Marketplace.Hooks/useProductos';

// 2. Importar los componentes de UI
import { PostDetailModal, PostDetailData } from './PostDetailModal';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton'; // Importar el Skeleton

// 3. Importar nuestro TIPO principal
import { MarketplaceProduct } from '@/features/Marketplace/Marketplace.Types/product';

interface InfiniteFeedProps {
  searchTerm: string;
  selectedCategoryId?: number; // Ahora es un número (ID)
  onStatsChange?: (hasResults: boolean, totalResults: number) => void;
}

// --- Helpers de Desarrollo (Opcional) ---
const AUGMENT_IMAGES_FOR_DEV = true; // Para pruebas de carrusel
const DEV_STRESS_LONG_DESC = false; // Para pruebas de layout

const buildDevImages = (seedBase: string, existing: string[]) => {
  if (!AUGMENT_IMAGES_FOR_DEV) return existing;
  if ((existing?.length ?? 0) > 1) return existing;
  const seed = encodeURIComponent(String(seedBase || 'seed').replace(/\s+/g, '-'));
  const variants = Array.from({ length: 12 }, (_, i) => `https://picsum.photos/seed/${seed}-${i + 1}/1200/675`);
  if (existing?.length === 1) return [existing[0], ...variants];
  return variants;
};
// --- Fin Helpers de Desarrollo ---


const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  searchTerm = '',
  selectedCategoryId,
  onStatsChange
}) => {
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useRef<HTMLDivElement | null>(null);

  // 4. Usar el NUEVO hook 'useProductos'
  const {
    data, // 'data' ahora contiene { pages: [{ productos: [], nextCursor, totalProductos }] }
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useProductos({
    busqueda: searchTerm.trim(),
    categoriaId: selectedCategoryId
  });

  // 5. "Aplanar" los productos de todas las páginas en un solo array
  const products = useMemo(() => data?.pages.flatMap(page => page.productos) ?? [], [data]);
  
  // 6. Obtener el total y si hay resultados
  // El total de productos lo sacamos de la primera página
  const totalResults = data?.pages[0]?.totalProductos ?? 0;
  const hasResults = products.length > 0;

  // Estado del Modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostDetailData | null>(null);

  // 7. Refactorizar el 'mapPostToDetail' para usar MarketplaceProduct
  const mapPostToDetail = (product: MarketplaceProduct): PostDetailData => {
    // Mapeamos los campos de 'MarketplaceProduct' a 'PostDetailData'
    const baseImages = product.imagenes.map(img => img.urlImagen) ?? [];
    const images = buildDevImages(String(product.id ?? product.nombre ?? 'product'), baseImages);

    const baseDesc = product.descripcion ?? 'Sin descripción';
    const longAddon =
      DEV_STRESS_LONG_DESC
        ? '\n\n' + 'Descripción extendida: '.concat(baseDesc, ' ').repeat(20)
        : '';

    return {
      id: String(product.id),
      titulo: product.nombre ?? 'Sin título',
      descripcion: baseDesc + longAddon,
      precio: product.precioActual, // Ya es un número
      stock: product.cantidad ?? 1, // Mapeado de 'cantidad'
      campus: product.campus ?? 'No especificado',
      categoria: product.categoria?.nombre ?? 'Sin categoría', // Mapeado de 'categoria.nombre'
      condicion: product.condicion ?? 'No especificado',
      fechaPublicacion: product.fechaAgregado ?? new Date(), // Mapeado de 'fechaAgregado'
      imagenes: images,
      vendedor: {
        id: product.vendedor.id,
        nombre: product.vendedor.usuario, // Mapeado de 'vendedor.usuario'
        avatarUrl: product.vendedor.avatarUrl ?? undefined,
        reputacion: product.vendedor.reputacion ?? 0, // Mapeado de 'vendedor.reputacion'
      }
    };
  };

  // Esta función ahora recibe un MarketplaceProduct
  const onOpenDetail = (product: MarketplaceProduct) => {
    setSelectedPost(mapPostToDetail(product));
    setOpenModal(true);
  };

  // Esta función ya es compatible con nuestro schema (usa 'vendedor.id')
  const handleContact = (detail: PostDetailData) => {
    const toId = detail.vendedor?.id ?? undefined;
    if (!toId) {
      console.error("No se puede contactar al vendedor sin un ID");
      return;
    }
    // Navega a la página de chats, pasando el ID del vendedor
    navigate(`/chats?toId=${String(toId)}`);
    setOpenModal(false);
  };

  // Notificar al componente padre (HomePage) sobre las estadísticas
  useEffect(() => {
    if (onStatsChange && !isLoading) onStatsChange(hasResults, totalResults);
  }, [hasResults, totalResults, isLoading, onStatsChange]);

  // Lógica del IntersectionObserver (Scroll Infinito)
  // Es 100% compatible con 'useInfiniteQuery'
  useEffect(() => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5, rootMargin: '200px' } // Cargar cuando esté a 200px de la vista
    );
    
    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }
    
    return () => observer.current?.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, products.length]);


  // --- Sub-componentes de Estado ---

  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
      <div className="text-8xl mb-6">🛒</div>
      <h3 className="text-2xl font-semibold mb-3 text-gray-700">No se encontraron productos</h3>
      <p className="text-center max-w-md text-gray-600 leading-relaxed">
        {searchTerm || selectedCategoryId
          ? 'Intenta ajustar tus filtros de búsqueda o explora otras categorías.'
          : 'No hay publicaciones disponibles en este momento.'}
      </p>
    </div>
  );

  // Skeleton para la carga inicial (podría mostrar 12 skeletons)
  const InitialLoadingState = () => (
     <>
      {Array.from({ length: 12 }, (_, i) => (
        <ProductCardSkeleton key={`skeleton-${i}`} />
      ))}
    </>
  );

  // Skeleton para las páginas siguientes (más pequeño)
  const LoadingMoreSkeleton = () => (
    <>
      {Array.from({ length: 3 }, (_, i) => ( // Muestra 3 skeletons al cargar más
        <ProductCardSkeleton key={`loading-more-${i}`} />
      ))}
    </>
  );

  const ErrorState = () => (
    <div className="col-span-full mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <div className="text-red-400 mr-4 text-2xl">⚠️</div>
        <div>
          <h4 className="text-red-800 font-medium text-lg">Error al cargar las publicaciones</h4>
          <p className="text-red-600 text-sm mt-1">
            {error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
          </p>
        </div>
      </div>
    </div>
  );

  // --- Renderizado Principal ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {!isLoading && (
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {products.length > 0 ? (
              <>
                Mostrando {products.length} de {totalResults} publicación{totalResults !== 1 ? 'es' : ''}
                {/* Lógica de filtros (opcional) */}
              </>
            ) : hasResults ? (
              'Cargando resultados...'
            ) : (
              'No hay resultados para mostrar'
            )}
          </div>
        </div>
      )}

      {isError && <ErrorState />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <InitialLoadingState />
        ) : !hasResults ? (
          <EmptyState />
        ) : (
          <>
            {products.map((product, index) => {
              // Asignar la ref al último elemento de la lista
              const isLastElement = index === products.length - 1;
              return (
                <div 
                  key={`${product.id}-${searchTerm}-${selectedCategoryId}`} 
                  ref={isLastElement ? lastPostElementRef : null}
                >
                  <ProductCard 
                    product={product} // Pasa el objeto MarketplaceProduct completo
                    onClick={() => onOpenDetail(product)} // El onClick abre el modal
                  />
                </div>
              );
            })}

            {isFetchingNextPage && <LoadingMoreSkeleton />}
          </>
        )}
      </div>

      {!hasNextPage && products.length > 0 && !isFetchingNextPage && (
        <div className="text-center py-8 text-gray-500 col-span-full">
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="mr-2">🎉</span>
            <span>Has visto todas las publicaciones disponibles</span>
          </div>
        </div>
      )}

      {/* Modal de detalle con acción de contacto */}
      <PostDetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        post={selectedPost} // 'post' es el tipo 'PostDetailData'
        onContact={handleContact}
      />
    </div>
  );
};

export default InfiniteFeed;