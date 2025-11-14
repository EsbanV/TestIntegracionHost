import React from 'react';

type Props = {
  // Ahora acepta múltiples imágenes para miniaturas
  images?: string[];
  src?: string;
  alt?: string;
  className?: string;
};

export const DetailImage: React.FC<Props> = ({ images, src, alt = 'Imagen del producto', className }) => {
  const imageList = (images && images.length > 0) ? images : (src ? [src] : []);
  const [current, setCurrent] = React.useState(0);

  if (imageList.length === 0) {
    return (
      <div className={`w-full aspect-video bg-gray-100 rounded-2xl grid place-items-center text-gray-400 border border-gray-200 ${className ?? ''}`}>
        Sin imagen
      </div>
    );
  }

  const currentSrc = imageList[current];

  return (
    <div className={className}>
      <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <img
          src={currentSrc}
          alt={alt}
          className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-60" />
      </div>

      {imageList.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2">
          {imageList.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
                current === idx ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <img src={img} alt={`Miniatura ${idx + 1}`} className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};