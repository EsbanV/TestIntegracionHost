import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { usePublicationById } from '@/features/ProductDetail/ProductDetail.Hooks/usePublicationById';
import { PublicationDetails } from './ProductDetail.Components/PublicationDetails';
import type { Publication } from '@/features/ProductDetail/ProductDetail.Types/publication';

export const PublicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { publication?: Publication } | null;
  const initialData = state?.publication;

  const { data, isLoading, isError } = usePublicationById(id, {
    enabled: !!id,
    initialData,
  });

  // Animación de entrada
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleContact = React.useCallback(
    (pubId: string) => {
      const seller = data?.seller;
      const qs = new URLSearchParams();
      if (seller?.id) qs.set('toId', String(seller.id));
      if (seller?.name) qs.set('toName', seller.name);
      if (seller?.avatarUrl) qs.set('toAvatar', seller.avatarUrl);

      navigate(`/chats${qs.toString() ? `?${qs}` : ''}`, {
        state: seller ? { toUser: seller } : undefined,
        replace: false,
      });
    },
    [data?.seller, navigate]
  );

  return (
    // Quita el fondo local para respetar el fondo global del layout
    <div className="min-h-[calc(100vh-64px)]">
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* Migas de pan y volver */}
        <div className="mb-4 flex items-center justify-between">
          <nav className="text-sm text-gray-500">
            <ol className="inline-flex items-center gap-2">
              <li>
                <Link to="/home" className="hover:text-gray-700">Inicio</Link>
              </li>
              <li className="opacity-60">/</li>
              <li className="text-gray-700 font-medium">Detalle</li>
            </ol>
          </nav>
          <Link
            to="/home"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Volver
          </Link>
        </div>

        {/* Estados */}
        {isLoading && (
          <main className="grid gap-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse h-[55vh]" />
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-44" />
          </main>
        )}

        {(isError || !data) && !isLoading && (
          <main className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-700">
            No se pudo cargar la publicación.
          </main>
        )}

        {data && !isLoading && (
          <main>
            <PublicationDetails
              publication={data}
              onContact={handleContact}
            />
          </main>
        )}
      </div>
    </div>
  );
};