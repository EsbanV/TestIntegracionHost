import React from "react";
import { useCallback, useMemo, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import SearchAndFilter from './components/SearchAndFilter'
import InfiniteFeed from './components/InfiniteFeed'
import Header from '../../shared/ui/Header'

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [feedStats, setFeedStats] = useState<{ hasResults: boolean; totalResults: number }>({ hasResults: true, totalResults: 0 })

  const categories = useMemo(() => [
    'Electrónicos','Libros y Materiales','Ropa y Accesorios','Deportes','Hogar y Jardín','Vehículos','Servicios',
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

  const handleSearchChange = useCallback((v: string) => setSearchTerm(v), [])
  const handleCategoryChange = useCallback((v: string) => setSelectedCategory(v), [])
  const handleClearFilters = useCallback(() => { setSearchTerm(''); setSelectedCategory('') }, [])
  const handleFeedStatsChange = useCallback((hasResults: boolean, totalResults: number) => setFeedStats({ hasResults, totalResults }), [])

  return (
    <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      <Sidebar active="marketplace" />

      <div className="min-w-0">
        
        <Header />
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
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
