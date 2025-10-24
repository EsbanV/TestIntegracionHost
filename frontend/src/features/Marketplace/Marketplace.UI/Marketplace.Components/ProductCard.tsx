import React from "react";
import { Link } from "react-router-dom";
import { RatingStars } from "./RatingStars";
// 1. Importar el TIPO unificado
import { MarketplaceProduct } from '@/features/Marketplace/Marketplace.Types/product';
import { formatCLP } from '@/features/Marketplace/Marketplace.Utils/format';
// 2. Importar hooks de Favoritos
import { useToggleFavorito } from '@/features/Marketplace/Marketplace.Hooks/useToggleFavorito';
import { useMisFavoritosIds } from '@/features/Marketplace/Marketplace.Hooks/useMisFavoritosIds';

interface ProductCardProps {
  product: MarketplaceProduct; // 3. Usar el tipo unificado
  className?: string;
  onClick?: (productId: number) => void;
  onEdit?: (productId: number) => void; 
  onDelete?: (productId: number) => void; 
}

// ... (getFormattedPrice sin cambios) ...

export default function ProductCard({
  product,
  className = "",
  onClick,
  onEdit,
  onDelete,
}: ProductCardProps) {
  
  // 4. Hooks de Favoritos
  const { data: favoritosSet } = useMisFavoritosIds();
  const { mutate: toggleFavorito, isLoading: isTogglingFav } = useToggleFavorito();
  const esFavorito = favoritosSet?.has(product.id);

  // 5. Mapeo de campos del NUEVO tipo 'MarketplaceProduct'
  const id = product.id;
  const title = product.nombre; // CAMBIO
  const description = product.descripcion; // CAMBIO
  const image = product.imagenes?.[0]?.urlImagen; // OK
  const price = product.precioActual; // CAMBIO
  const categoryName = product.categoria?.nombre; // OK
  const author = product.vendedor.usuario; // CAMBIO
  const avatar = product.vendedor.avatarUrl; // OK
  const rating = product.vendedor.reputacion ?? 0; // CAMBIO
  const stock = product.cantidad; // CAMBIO

  const formattedPrice = getFormattedPrice(price);
  const showActions = onEdit || onDelete;
  const detailUrl = `/producto/${id}`;
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar que el 'onClick' se dispare si se hizo clic en un botón interno
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) {
      return; 
    }
    
    if (onClick) {
      onClick(id);
    } else {
      window.location.href = detailUrl;
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el modal
    toggleFavorito({ productoId: id });
  };

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      {/* 6. Botón de Favorito AÑADIDO */}
      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={isTogglingFav}
        aria-label={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
        className="absolute top-3 left-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white disabled:opacity-50"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className={`w-5 h-5 transition-all ${esFavorito ? 'text-red-500 fill-red-500' : 'text-gray-600 fill-transparent'}`}
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 010-6.364A4.5 4.5 0 0110.682 6.318L12 7.636l1.318-1.318a4.5 4.5 0 016.364 0 4.5 4.5 0 010 6.364L12 20.364l-7.682-7.682z" />
        </svg>
      </button>

      {image && (
        <div className="relative aspect-video w-full">
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
          
          {formattedPrice && (
              <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                  {formattedPrice}
              </div>
          )}
          {/* Ocultamos categoría si hay botón de fav para no saturar */}
          {/* {categoryName && ( ... )} */}
        </div>
      )}

      <div className="p-4 md:p-5">
        <div className="flex items-center mb-3 md:mb-4">
          {avatar && <img src={avatar} alt={author} className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-3 border-2 border-gray-100" />}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs md:text-sm font-medium text-gray-900 truncate">{author || "Vendedor"}</h4>
          </div>
        </div>

        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2 leading-tight">
            {onClick ? title : (
                <Link to={detailUrl} className="hover:text-violet-600 transition-colors" onClick={e => e.stopPropagation()}>
                    {title}
                </Link>
            )}
        </h3>
        
        {description && (
          <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <RatingStars rating={rating} />
              <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
            </span>
            {/* 7. 'stock' ahora es 'cantidad' y puede ser null */}
            {typeof stock === "number" && stock > 0 && (
              <>
                <span className="opacity-60">•</span>
                <span>{Intl.NumberFormat().format(stock)} en stock</span>
              </>
            )}
            {/* 8. ELIMINAMOS 'sales', ya que no existe en el nuevo schema */}
          </div>

          {/* ... (Lógica de 'showActions' sin cambios) ... */}
          {showActions ? (
             <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={(e) => {e.stopPropagation(); handleCardClick();}} className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">Ver</button>
                {onEdit && <button type="button" onClick={(e) => {e.stopPropagation(); onEdit(id);}} className="text-xs md:text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline">Editar</button>}
                {onDelete && <button type="button" onClick={(e) => {e.stopPropagation(); onDelete(id);}} className="text-xs md:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline">Eliminar</button>}
            </div>
          ) : (
             <Link 
                to={detailUrl}
                onClick={e => e.stopPropagation()}
                className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
             >
               Ver detalle
             </Link> 
          )}
        </div>
      </div>
    </div>
  );
}