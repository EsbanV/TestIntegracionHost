import type { Post as PostType } from "@/features/Marketplace/Marketplace.Types/post";
import React from "react";
import Card from "../../../../../public/components/Card";
import Button from "../../../../../public/components/Button";
import { formatCLP } from "@/features/Marketplace/Marketplace.Utils/format";

/* Usamos una interfaz flexible con campos opcionales para evitar errores
   cuando el tipo externo no tiene exactamente las mismas propiedades */
interface Publication {
  id?: string | number;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: string | number;
  image?: string | null;
  author?: string;
  createdAt?: string | Date | null;
}

type PublicationCardProps = {
  publication: Publication;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
};

function formatPrice(value?: string | number) {
  if (value === undefined || value === null) return "";
  const numValue = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(numValue)) return String(value);
  return formatCLP(numValue);
}

function formatDate(d?: string | Date | null) {
  if (!d) return "";
  if (typeof d === "string") return d;
  try {
    return d.toLocaleDateString();
  } catch {
    return String(d);
  }
}

export default function PublicationCard({
  publication,
  onView,
  onEdit,
  onDelete,
  className = "",
}: PublicationCardProps) {
  const title = publication.title ?? "";
  const subtitle = publication.subtitle ?? "";
  const description = publication.description ?? "";
  const price = publication.price;
  const image = publication.image ?? undefined;
  const author = publication.author ?? "";
  const createdAt = publication.createdAt ?? null;

  return (
    <Card className={`transition hover:shadow-md ${className}`} imageSrc={image} imageAlt={title || "publicación"}>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p> : null}
          </div>

          {price !== undefined ? (
            <div className="flex-shrink-0 text-right ml-3">
              <div className="text-sm font-semibold text-gray-900">{formatPrice(price)}</div>
              {createdAt ? <div className="text-xs text-gray-400">{formatDate(createdAt)}</div> : null}
            </div>
          ) : null}
        </div>

        {description ? <div className="mt-3 text-sm text-gray-700 line-clamp-3">{description}</div> : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">{author ? `Por ${author}` : (createdAt ? formatDate(createdAt) : null)}</div>

          <div className="ml-auto flex items-center gap-2">
            {onView && <Button type="button" className="inline-flex items-center h-8 px-3 text-sm" onClick={onView}>Ver</Button>}
            {onEdit && <Button type="button" className="inline-flex items-center h-8 px-3 text-sm" onClick={onEdit}>Editar</Button>}
            {onDelete && <Button type="button" className="inline-flex items-center h-8 px-3 text-sm text-rose-600" onClick={onDelete}>Eliminar</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}