import React, { useCallback, useMemo, useState } from 'react'
import SearchAndFilter from './Marketplace.Components/SearchAndFilter'
import InfiniteFeed from './Marketplace.Components/InfiniteFeed'

export default function HomePage() {
  // --- Estado ---
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [feedStats, setFeedStats] = useState({ hasResults: true, totalResults: 0 })

  // --- Datos Estáticos ---
  const categories = useMemo(() => [
    'Electrónicos', 'Libros y Materiales', 'Ropa y Accesorios', 
    'Deportes', 'Hogar y Jardín', 'Vehículos', 'Servicios',
  ], [])

  const categoryMap: Record<string, string> = {
    'Electrónicos': 'electronics',
    'Libros y Materiales': 'books',
    'Ropa y Accesorios': 'clothing',
    'Deportes': 'sports',
    'Hogar y Jardín': 'home',
    'Vehículos': 'vehicles',
    'Servicios': 'services',
  }

  const selectedCategoryId = selectedCategory ? categoryMap[selectedCategory] ?? '' : ''

  // --- Manejadores ---
  const handleSearchChange = useCallback((v: string) => setSearchTerm(v), [])
  const handleCategoryChange = useCallback((v: string) => setSelectedCategory(v), [])
  const handleClearFilters = useCallback(() => { setSearchTerm(''); setSelectedCategory('') }, [])
  const handleFeedStatsChange = useCallback((hasResults: boolean, totalResults: number) => setFeedStats({ hasResults, totalResults }), [])

  return (
    // Usamos 'w-full' para asegurar que use todo el espacio del Outlet
    <div className="w-full space-y-6">
      
      {/* Barra de Búsqueda Sticky
          - top-0: Se pega al borde superior del área de scroll (PageLayout main)
          - z-30: Se mantiene sobre las tarjetas al hacer scroll
          - mx y px negativos: Para compensar el padding del contenedor padre y que la barra llegue de borde a borde
      */}
      <div className="sticky top-0 z-30 -mx-4 px-4 md:-mx-6 md:px-6 py-3 bg-gray-100/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto">
          <SearchAndFilter
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            categories={categories}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onClearFilters={handleClearFilters}
            hasResults={feedStats.hasResults}
            totalResults={feedStats.totalResults}
          />
        </div>
      </div>

      {/* Área del Feed */}
      <div className="w-full max-w-7xl mx-auto min-h-[500px]">
        <InfiniteFeed
          searchTerm={searchTerm.trim()}
          selectedCategoryId={selectedCategoryId}
          onStatsChange={handleFeedStatsChange}
        />
      </div>
    </div>
  )
}