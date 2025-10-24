import React, { useCallback, useMemo, useState } from 'react';
import { Sidebar } from '@/features/shared/ui/Sidebar';
import SearchAndFilter from '@/features/Marketplace/Marketplace.UI/Marketplace.Components/SearchAndFilter';
import InfiniteFeed from '@/features/Marketplace/Marketplace.UI/Marketplace.Components/InfiniteFeed';
import Header from '@/features/shared/ui/Header';
// Importamos el hook de categorías
import { useCategorias } from '@/features/Marketplace/Marketplace.Hooks/useCategorias';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(''); // Ahora guardamos el *nombre*
  const [feedStats, setFeedStats] = useState<{ hasResults: boolean; totalResults: number }>({ hasResults: true, totalResults: 0 });

  // 1. Obtenemos categorías dinámicamente
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategorias();

  // 2. Creamos la lista de nombres y el mapa ID/Nombre
  const { categories, categoryMap } = useMemo(() => {
    if (!categoriesData) return { categories: [], categoryMap: {} };
    
    const catMap: Record<string, number> = {}; // Mapa de Nombre -> ID
    const catNombres: string[] = [];
    
    categoriesData.forEach(cat => {
      catNombres.push(cat.nombre);
      catMap[cat.nombre] = cat.id;
    });
    
    return { categories: catNombres, categoryMap: catMap };
  }, [categoriesData]);

  // 3. Obtenemos el ID de la categoría seleccionada
  const selectedCategoryId = selectedCategoryName ? categoryMap[selectedCategoryName] : undefined;

  const handleSearchChange = useCallback((v: string) => setSearchTerm(v), []);
  const handleCategoryChange = useCallback((v: string) => setSelectedCategoryName(v), []);
  const handleClearFilters = useCallback(() => { setSearchTerm(''); setSelectedCategoryName('') }, []);
  const handleFeedStatsChange = useCallback((hasResults: boolean, totalResults: number) => setFeedStats({ hasResults, totalResults }), []);

  return (
    <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      <Sidebar active="marketplace" />
      <div className="min-w-0">
        <Header />
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <SearchAndFilter
              searchTerm={searchTerm}
              selectedCategory={selectedCategoryName} // Usamos el nombre
              categories={categories} // Pasamos la lista de nombres
              onSearchChange={handleSearchChange}
              onCategoryChange={handleCategoryChange}
              onClearFilters={handleClearFilters}
              hasResults={feedStats.hasResults}
              totalResults={feedStats.totalResults}
              // Opcional: mostrar 'cargando' en el select
              // isLoadingCategories={isLoadingCategories} 
            />
          </div>
        </div>

        <main className="py-6">
          <InfiniteFeed
            searchTerm={searchTerm.trim()}
            selectedCategoryId={selectedCategoryId} // Pasamos el ID
            onStatsChange={handleFeedStatsChange}
          />
        </main>
      </div>
    </div>
  );
}