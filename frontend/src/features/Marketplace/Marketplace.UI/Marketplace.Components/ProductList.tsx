import useProducts from '@/features/Marketplace/Marketplace.Hooks/useProductos' // Usar el hook renombrado
import ProductCard from './ProductCard' // Usar el componente renombrado
import ProductCardSkeleton from './ProductCardSkeleton'; // Usar el skeleton renombrado

export default function ProductList() {
  const { products, isLoading, isError } = useProducts()

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
  
  if (isError) return <p className="text-red-600 text-center py-8">Error al cargar productos.</p>

  if (products.length === 0) return <p className="text-gray-500 text-center py-8">No hay productos disponibles.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        // Se pasa todo el objeto 'product' al componente
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
