import { useQuery } from '@tanstack/react-query';
import { getPublicationById } from '../../services/publicationsService';
import type { Publication } from '../ProductDetail.Types/publication';

export function publicationKeys(id?: string) {
  return ['publication', id] as const;
}

type Options = {
  enabled?: boolean;
  initialData?: Publication;
};

export function usePublicationById(id?: string, options?: Options) {
  const { enabled = !!id, initialData } = options ?? {};
  return useQuery<Publication>({
    queryKey: publicationKeys(id),
    queryFn: () => getPublicationById(id!),
    enabled,
    initialData,
  });
}