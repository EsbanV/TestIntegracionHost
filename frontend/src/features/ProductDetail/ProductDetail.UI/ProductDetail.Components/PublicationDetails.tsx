import React from 'react';
import type { Publication } from '../../ProductDetail.Types/publication';
import { PriceBuyBox } from './PriceBuyBox';
import { RatingStars } from './RatingStars';
import { ImageCarousel } from './ImageCarousel';

type Props = {
  publication: Publication;
  onContact?: (id: string) => void;
};

const formatCLP = (v: number | string | undefined) => {
  const num = typeof v === 'number' ? v : parseInt(String(v ?? '0').replace(/\D/g, ''), 10);
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(num || 0);
};

const formatDate = (d?: string | number | Date) =>
  d ? new Date(d).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase() || 'U';
};

export const PublicationDetails: React.FC<Props> = ({ publication, onContact }) => {
  const category = (publication as any).category ?? (publication as any).categoryName; // compat
  const condition = (publication as any).condition ?? (publication as any).condicion;
  const campus = (publication as any).campus;
  const publishedAt = publication.createdAt ?? (publication as any).fechaPublicacion;
  const sellerReputation =
    typeof (publication as any)?.seller?.reputation === 'number'
      ? (publication as any).seller.reputation
      : 0;

  return (
    <article className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna izquierda: carrusel + descripción */}
      <div className="lg:col-span-2 space-y-5">
        {/* Carrusel con overlay de precio */}
        <div className="relative rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
          <ImageCarousel
            images={publication.images ?? []}
            altPrefix={publication.title || 'Imagen'}
            className="mb-2"
            rounded="rounded-xl"
          />
          {publication.price != null && (
            <div className="pointer-events-none absolute top-5 right-6">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-green-600 text-white shadow-lg">
                {formatCLP(publication.price)}
              </span>
            </div>
          )}
        </div>

        {/* Chips de metadata como en el modal */}
        <div className="flex flex-wrap gap-2">
          {category && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200">
              {String(category)}
            </span>
          )}
          {condition && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-800 border border-blue-100">
              {String(condition)}
            </span>
          )}
          {campus && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-violet-50 text-violet-800 border border-violet-100">
              {String(campus)}
            </span>
          )}
          {publishedAt && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-700 border border-gray-200">
              Publicado: {formatDate(publishedAt)}
            </span>
          )}
        </div>

        {/* Descripción con estilo del modal */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-1.5">
          <h1 className="text-2xl font-semibold text-slate-900">{publication.title}</h1>
          {publication.description && (
            <p
              className="text-sm md:text-[15px] leading-6 text-slate-700 whitespace-pre-wrap [overflow-wrap:anywhere] hyphens-auto"
            >
              {publication.description}
            </p>
          )}
        </section>
      </div>

      {/* Columna derecha: contacto, vendedor y atributos */}
      <div className="lg:col-span-1 space-y-5">
        {/* Caja de contacto (renombrada pero reusando PriceBuyBox con onContact) */}
        <PriceBuyBox
          price={publication.price}
          stock={publication.stock}
          onContact={() => onContact?.(publication.id)}
        />

        {/* Vendedor (con avatar + RatingStars como el modal) */}
        <section className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Vendedor</h3>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-slate-700 font-bold">
              {publication.seller?.avatarUrl ? (
                <img
                  src={publication.seller.avatarUrl}
                  alt={publication.seller.name || 'Vendedor'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(publication.seller?.name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {publication.seller?.name ?? 'Usuario'}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                <RatingStars rating={sellerReputation} />
                <span className="font-semibold">{Number(sellerReputation || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Atributos (dt/dd) como en el modal */}
        <section className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <dt className="text-slate-500">Precio</dt>
              <dd className="font-bold text-emerald-700">{formatCLP(publication.price as any)}</dd>
            </div>
            {typeof publication.stock !== 'undefined' && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Stock</dt>
                <dd className="font-semibold">{publication.stock}</dd>
              </div>
            )}
            {campus && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Campus</dt>
                <dd className="font-semibold">{String(campus)}</dd>
              </div>
            )}
            {category && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Categoría</dt>
                <dd className="font-semibold">{String(category)}</dd>
              </div>
            )}
            {condition && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Condición</dt>
                <dd className="font-semibold">{String(condition)}</dd>
              </div>
            )}
            {publishedAt && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Publicado</dt>
                <dd className="font-semibold">{formatDate(publishedAt)}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </article>
  );
};