import { Link } from "react-router-dom";
import { RatingStars } from "./RatingStars";

export type ItemCardProps = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  price?: string | number;
  categoryName?: string;
  author?: string;
  avatar?: string;
  timeAgo?: string;
  rating?: number;
  stock?: number;
};

export default function ItemCard({
  id, title, description, image, price, categoryName,
  author, avatar, timeAgo, rating = 0, stock,
}: ItemCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full">
 {image && (
        <div className="relative aspect-video w-full">
            <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
            {/* 🛑 ELIMINAR ESTE DIV POR COMPLETO:
            <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                {price} 
            </div> 
            */}
            {categoryName && (
                <div className="absolute top-3 left-3">
                    {/* ... (Span de Categoría) ... */}
                </div>
            )}
        </div>
    )}

    <div className="p-4 md:p-5">
        {/* Añadir el precio junto al título en el cuerpo */}
        <div className="flex justify-between items-start">
             <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2 leading-tight">{title}</h3>
             {price && (
                 <span className="text-lg md:text-xl font-bold text-green-600 ml-4 whitespace-nowrap">{price}</span>
             )}
        </div>
        
        {/* ... (Resto del contenido del cuerpo) ... */}
    </div>

      <div className="p-4 md:p-5">
        <div className="flex items-center mb-3 md:mb-4">
          {avatar && <img src={avatar} alt={author} className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-3 border-2 border-gray-100" />}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs md:text-sm font-medium text-gray-900 truncate">{author}</h4>
            {timeAgo && <p className="text-xs text-gray-500">{timeAgo}</p>}
          </div>
        </div>

        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2 leading-tight">{title}</h3>
        {description && (
          <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <RatingStars rating={Number(rating) || 0} />
              <span className="font-semibold text-gray-700">{Number(rating || 0).toFixed(1)}</span>
            </span>
            {typeof stock !== "undefined" && (
              <>
                <span className="opacity-60">•</span>
                <span>{Intl.NumberFormat().format(Number(stock))} stock </span>
              </>
            )}
          </div>
            <Link 
             to={`/producto/${id}`} // <-- CORRECCIÓN: Usar /producto/ en lugar de /publicacion/
             className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Ver detalle
          </Link> 
        </div>
      </div>
    </div>
  );
}
