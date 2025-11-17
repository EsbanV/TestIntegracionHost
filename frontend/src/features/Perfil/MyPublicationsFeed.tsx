import React, { useEffect } from 'react';
import { usePublicationsFeed } from '@/features/Perfil/perfil.hooks';
import { PublicationsList } from '@/features/Perfil/Perfil.Components';

interface MyPublicationsFeedProps {
  searchTerm?: string;
  selectedCategoryId?: string;
  authorId?: string;
  onStatsChange?: (hasResults: boolean, totalResults: number) => void;
}

const MyPublicationsFeed: React.FC<MyPublicationsFeedProps> = ({ 
  searchTerm = '', 
  selectedCategoryId = '', 
  authorId,
  onStatsChange 
}) => {
  
  // 1. Usar el hook refactorizado
  const { 
    items, 
    isLoading, 
    isError, 
    hasResults, 
    hasNextPage, 
    isFetchingNextPage, 
    totalResults, 
    lastPostElementRef 
  } = usePublicationsFeed({ 
    searchTerm, 
    selectedCategoryId, 
    authorId,
    // Si hay un authorId específico (perfil público), 'onlyMine' es false implícitamente 
    // en la lógica del hook, o podemos pasarlo explícitamente si queremos controlar la edición.
    // Por defecto asumimos que si se usa este componente sin authorId, es "mi feed".
    onlyMine: !authorId 
  });

  // 2. Efecto para comunicar estadísticas al padre (PerfilPage) si es necesario
  useEffect(() => {
    if(onStatsChange && !isLoading) {
      onStatsChange(hasResults, totalResults);
    }
  }, [hasResults, totalResults, isLoading, onStatsChange]);

  // 3. Renderizar la lista visual
  return (
    <PublicationsList 
       items={items}
       isLoading={isLoading}
       isError={isError}
       hasResults={hasResults}
       hasNextPage={hasNextPage}
       isFetchingNextPage={isFetchingNextPage}
       lastPostRef={lastPostElementRef}
       // Solo mostramos el botón de editar si NO hay un authorId explícito (es decir, es mi perfil)
       // O si el authorId coincide con el usuario logueado (validación extra)
       showEditButton={!authorId} 
    />
  );
};

export default MyPublicationsFeed;