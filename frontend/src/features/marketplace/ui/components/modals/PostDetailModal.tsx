import React, { useEffect, useRef } from "react";
import { ImageCarousel } from "./ImageCarousel";
import { RatingStars } from "../RatingStars";

export type PostDetailData = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  stock: number;
  campus: string;
  categoria: string;
  condicion: string;
  fechaPublicacion: string | number | Date;
  imagenes?: string[];
  vendedor?: {
    id?: string | number;
    nombre: string;
    avatarUrl?: string;
    reputacion?: number;
  };
};

type PostDetailModalProps = {
  open: boolean;
  onClose: () => void;
  post?: PostDetailData | null;
  onContact?: (post: PostDetailData) => void;
};

const formatCLP = (v: number) =>
  v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const formatDate = (d: string | number | Date) =>
  new Date(d).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "U";
};

export function PostDetailModal({ open, onClose, post, onContact }: PostDetailModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloqueo de scroll del body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => closeBtnRef.current?.focus(), 0);
  }, [open]);

  if (!open || !post) return null;

  const reputacion = typeof post.vendedor?.reputacion === "number" ? post.vendedor!.reputacion! : 0;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/45 backdrop-blur-sm px-4"
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-detail-title"
        aria-describedby="post-detail-desc"
        className="w-[min(1040px,96vw)] max-h-[92vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-white/90 backdrop-blur">
          <h2 id="post-detail-title" className="text-xl md:text-2xl font-extrabold text-slate-900 truncate">
            {post.titulo}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full h-9 w-9 grid place-items-center border border-gray-200 text-slate-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            ×
          </button>
        </div>

        {/* Body con columnas scrolleables y sin desbordes */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-0 min-h-0">
          {/* Izquierda */}
          <div className="p-5 md:p-6 min-h-0 max-h-[70vh] overflow-y-auto overscroll-contain">
            <div className="relative">
              <ImageCarousel
                images={post.imagenes ?? []}
                altPrefix={post.titulo || "Imagen"}
                className="mb-4"
                rounded="rounded-xl"
              />
              <div className="pointer-events-none absolute top-3 right-3">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-green-600 text-white shadow-lg">
                  {formatCLP(post.precio)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.categoria && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200">
                  {post.categoria}
                </span>
              )}
              {post.condicion && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-800 border border-blue-100">
                  {post.condicion}
                </span>
              )}
              {post.campus && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-violet-50 text-violet-800 border border-violet-100">
                  {post.campus}
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-700 border border-gray-200">
                Publicado: {formatDate(post.fechaPublicacion)}
              </span>
            </div>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-700">Descripción</h3>
              <p
                id="post-detail-desc"
                className="text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words [overflow-wrap:anywhere] hyphens-auto"
              >
                {post.descripcion}
              </p>
            </section>
          </div>

          {/* Derecha */}
          <aside className="p-5 md:p-6 border-t md:border-t-0 md:border-l border-gray-100 bg-slate-50 min-h-0 max-h-[70vh] overflow-y-auto overscroll-contain">
            {/* Vendedor */}
            <section className="mb-5 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Vendedor</h3>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-slate-700 font-bold">
                  {post.vendedor?.avatarUrl ? (
                    <img src={post.vendedor.avatarUrl} alt={post.vendedor.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(post.vendedor?.nombre)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {post.vendedor?.nombre ?? "Usuario"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <RatingStars rating={reputacion} />
                    <span className="font-semibold">{Number(reputacion || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Atributos */}
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Precio</dt>
                <dd className="font-bold text-emerald-700">{formatCLP(post.precio)}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Stock</dt>
                <dd className="font-semibold">{post.stock}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Campus</dt>
                <dd className="font-semibold">{post.campus}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Categoría</dt>
                <dd className="font-semibold">{post.categoria}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Condición</dt>
                <dd className="font-semibold">{post.condicion}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <dt className="text-slate-500">Publicado</dt>
                <dd className="font-semibold">{formatDate(post.fechaPublicacion)}</dd>
              </div>
            </dl>
          </aside>
        </div>

        {/* Footer */}
        <div className="px-5 md:px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-full border border-gray-300 bg-white font-semibold text-slate-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => onContact?.(post)}
            className="h-10 px-4 rounded-full border-2 border-violet-600 bg-violet-600 text-white font-extrabold hover:brightness-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            disabled={!onContact}
            title="Iniciar chat con el vendedor"
          >
            Contactar
          </button>
        </div>
      </div>
    </div>
  );
}