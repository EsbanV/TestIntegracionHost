import { useState, useCallback } from 'react'
import InfiniteFeed from './features/marketplace/ui/components/InfiniteFeed'
import SearchAndFilter from './features/marketplace/ui/components/SearchAndFilter'
import { useDebounce } from './hooks/usePostsWithFilters'
import Header from './features/shared/ui/Header'
import FloatingChat from './features/shared/ui/FloatingChat'

function App() {
  // Estado para la búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [feedStats, setFeedStats] = useState({ hasResults: true, totalResults: 0 })

  // Debounce del término de búsqueda para optimizar las consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Mapeo de categorías para compatibilidad
  const categories = [
    'Electrónicos',
    'Libros y Materiales', 
    'Ropa y Accesorios',
    'Deportes',
    'Hogar y Jardín',
    'Vehículos',
    'Servicios'
  ]

  // Mapear nombres de categorías a IDs
  const categoryMap: Record<string, string> = {
    'Electrónicos': 'electronics',
    'Libros y Materiales': 'books',
    'Ropa y Accesorios': 'clothing',
    'Deportes': 'sports',
    'Hogar y Jardín': 'home',
    'Vehículos': 'vehicles',
    'Servicios': 'services'
  }

  // Convertir categoría seleccionada a ID
  const selectedCategoryId = selectedCategory ? categoryMap[selectedCategory] || '' : ''

  // Manejadores de eventos con optimización
  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
  }, [])

  const handleCategoryChange = useCallback((newCategory: string) => {
    setSelectedCategory(newCategory)
  }, [])

  // Manejador para limpiar filtros
  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('')
  }, [])

  // Callback para recibir estadísticas del feed
  const handleFeedStatsChange = useCallback((hasResults: boolean, totalResults: number) => {
    setFeedStats({ hasResults, totalResults })
  }, [])

  return (
    <div className="min-h-screen">
      <header>
        <Header/>
      </header>
      
      {/* Componente de búsqueda y filtros */}
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
      
      <main className="py-6">
        {/* Feed con filtros integrados */}
        <InfiniteFeed
          searchTerm={debouncedSearchTerm}
          selectedCategoryId={selectedCategoryId}
          onStatsChange={handleFeedStatsChange}
        />
      </main>
      {/* Floating chat widget visible en todas las rutas excepto /chats */}
      <FloatingChat />
    </div>
  )
}

export default App