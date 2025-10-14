import { useCallback, useMemo, useState } from 'react'

// Ajusta estos paths si no usas alias "@"
import { Sidebar } from './components/Sidebar'
import SearchAndFilter from './components/SearchAndFilter'
import InfiniteFeed from './components/InfiniteFeed'

export default function HomePage() {
  // Estado de filtros / stats
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [feedStats, setFeedStats] = useState<{ hasResults: boolean; totalResults: number }>({
    hasResults: true,
    totalResults: 0,
  })

  // Catálogo visible en el <select>
  const categories = useMemo(
    () => [
      'Electrónicos',
      'Libros y Materiales',
      'Ropa y Accesorios',
      'Deportes',
      'Hogar y Jardín',
      'Vehículos',
      'Servicios',
    ],
    []
  )

  // Mapeo nombre → id que consume el feed
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

  // Handlers
  const handleSearchChange = useCallback((v: string) => setSearchTerm(v), [])
  const handleCategoryChange = useCallback((v: string) => setSelectedCategory(v), [])
  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('')
  }, [])
  const handleFeedStatsChange = useCallback((hasResults: boolean, totalResults: number) => {
    setFeedStats({ hasResults, totalResults })
  }, [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Lateral */}
      <Sidebar active="marketplace" />

      {/* Contenido */}
      <div className="min-w-0">
        {/* Barra superior / filtros */}
        <div className="sticky top-0 z-10 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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

        {/* Feed */}
        <main className="py-6">
          <InfiniteFeed
            searchTerm={searchTerm.trim()}
            selectedCategoryId={selectedCategoryId}
            onStatsChange={handleFeedStatsChange}
          />
        </main>
      </div>
    </div>
  )
}
