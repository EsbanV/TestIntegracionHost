import React, { useState } from 'react';

// Tipos para las props del componente
interface SearchAndFilterProps {
  onSearchChange: (searchTerm: string) => void;
  onCategoryChange: (category: string) => void;
  onClearFilters?: () => void; // Nueva prop para limpiar filtros
  categories: string[];
  selectedCategory: string;
  searchTerm: string;
  hasResults?: boolean; // Nueva prop para saber si hay resultados
  totalResults?: number; // Nueva prop para mostrar cantidad de resultados
}

// Componente principal de búsqueda y filtros
const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearchChange,
  onCategoryChange,
  onClearFilters,
  categories,
  selectedCategory,
  searchTerm,
  hasResults = true,
  totalResults = 0
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Manejador para el cambio en la búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  // Manejador para el cambio de categoría
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(event.target.value);
  };

  return (
    <div className="search-filter-container bg-transparent">
      <div className="search-filter-wrapper bg-transparent flex flex-wrap gap-2 items-center">
        {/* Barra de búsqueda */}
        <div className="search-input-container bg-transparent">
          <div className={`search-input-wrapper ${isSearchFocused ? 'search-input-focused' : ''} bg-transparent`}>
            {/* Input de búsqueda */}
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input bg-white bg-opacity-70 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
            />

            {/* Botón para limpiar búsqueda */}
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="search-clear-btn text-gray-500 hover:text-gray-700 bg-transparent"
                type="button"
                title="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Select de categorías */}
        <div className="category-select-container bg-transparent">
          <div className="category-select-wrapper bg-transparent">
            {/* Select de categorías */}
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="category-select bg-white bg-opacity-70 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón para limpiar todos los filtros */}
        {(searchTerm || selectedCategory) && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white bg-opacity-60 hover:bg-opacity-80 rounded-md transition-colors duration-200 border border-gray-300"
            type="button"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Información de resultados mejorada */}
      <div className="search-info">
        {(searchTerm || selectedCategory) && (
          <>
            {searchTerm && (
              <span className="search-results-text">
                Búsqueda: <strong>"{searchTerm}"</strong>
              </span>
            )}
            {selectedCategory && (
              <span className="category-results-text">
                Categoría: <strong>{selectedCategory}</strong>
              </span>
            )}
            {hasResults && totalResults > 0 && (
              <span className="results-count-text">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </>
        )}
        
        {/* Mostrar total sin filtros cuando no hay filtros activos */}
        {!searchTerm && !selectedCategory && totalResults > 0 && (
          <span className="text-gray-500 text-xs">
            Mostrando {totalResults} publicaciones
          </span>
        )}
      </div>

      {/* Mensaje de no resultados mejorado */}
      {(searchTerm || selectedCategory) && !hasResults && (
        <div className="no-results-container bg-transparent">
          <div className="no-results-message">
            <div className="text-4xl mb-3">🔍</div>
            <h3>No se encontraron resultados</h3>
            <p>
              {searchTerm && selectedCategory 
                ? `No hay publicaciones que coincidan con "${searchTerm}" en la categoría "${selectedCategory}"`
                : searchTerm
                ? `No hay publicaciones que coincidan con "${searchTerm}"`
                : `No hay publicaciones en la categoría "${selectedCategory}"`
              }
            </p>
            <div className="no-results-suggestions">
              <h4>Sugerencias:</h4>
              <ul>
                <li>Verifica la ortografía de las palabras</li>
                <li>Intenta con términos más generales</li>
                <li>Prueba con una categoría diferente</li>
                {onClearFilters && (
                  <li>
                    <button 
                      onClick={onClearFilters}
                      className="clear-filters-btn"
                    >
                      Limpiar todos los filtros
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;