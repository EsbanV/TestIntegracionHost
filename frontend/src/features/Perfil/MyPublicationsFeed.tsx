import React, { useEffect } from 'react';
import { usePublicationsFeed } from '@/features/Perfil/perfil.hooks';
import { PublicationsList } from '@/features/Perfil/Perfil.Components';

interface MyPublicationsFeedProps {
  searchTerm?: string;
  selectedCategoryId?: string;
  authorId?: string;
  onStatsChange?: (hasResults: boolean, totalResults: number) => void;
  onProductClick?: (item: any) => void;
}

const MyPublicationsFeed: React.FC<MyPublicationsFeedProps> = ({ 
  searchTerm = '', 
  selectedCategoryId = '', 
  authorId,
  onStatsChange,
  onProductClick
}) => {
  
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
    onlyMine: !authorId 
  });

  useEffect(() => {
    if(onStatsChange && !isLoading) {
      onStatsChange(hasResults, totalResults);
    }
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
       showEditButton={!authorId}
       onItemClick={onProductClick}
    />
  );
};

export default MyPublicationsFeed;