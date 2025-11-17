import React from 'react';
import { usePublicationsFeed } from './perfil.hooks';
import { PublicationsList } from './Perfil.Components'; // Importamos el componente visual unificado

interface MyPublicationsFeedProps {
  searchTerm?: string;
  onStatsChange?: (has: boolean, total: number) => void;
}

const MyPublicationsFeed = ({ searchTerm, onStatsChange }: MyPublicationsFeedProps) => {
  
  const { 
    items, isLoading, isError, hasResults, hasNextPage, isFetchingNextPage, totalResults, lastPostElementRef 
  } = usePublicationsFeed({ searchTerm });

  // Efecto para comunicar estadísticas al padre (si es necesario)
  React.useEffect(() => {
    if(onStatsChange && !isLoading) onStatsChange(hasResults, totalResults);
  }, [hasResults, totalResults, isLoading, onStatsChange]);

  return (
    <PublicationsList 
       items={items}
       isLoading={isLoading}
       isError={isError}
       hasResults={hasResults}
       hasNextPage={hasNextPage}
       isFetchingNextPage={isFetchingNextPage}
       lastPostRef={lastPostElementRef}
       showEditButton={true} // ¡Aquí activamos el modo edición porque es MI perfil!
    />
  );
};

export default MyPublicationsFeed;