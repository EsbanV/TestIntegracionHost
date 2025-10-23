import React, { useEffect, useMemo, useRef, useState } from "react";

type ImageCarouselProps = {
  images: string[];
  altPrefix?: string;
  className?: string;
  rounded?: string; // tailwind rounded classes
};

const FALLBACK_MAIN = "https://picsum.photos/seed/fallback-main/1200/675";
const FALLBACK_THUMB = "https://picsum.photos/seed/fallback-thumb/200/200";

export function ImageCarousel({
  images,
  altPrefix = "Imagen",
  className = "",
  rounded = "rounded-xl",
}: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const startXRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const total = images.length;
  const current = useMemo(() => images[index] ?? "", [images, index]);

  useEffect(() => {
    setIndex(0);
  }, [images.join("|")]);

  const go = (dir: 1 | -1) => {
    if (!total) return;
    setIndex((i) => (i + dir + total) % total);
  };

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = startXRef.current;
    if (startX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    startXRef.current = null;
  };

  if (!total) {
    return (
      <div className={`w-full aspect-[16/9] ${rounded} border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-100 ${className}`} />
    );
  }

  return (
    <div className={className} ref={containerRef}>
      {/* Main image */}
      <div
        className={`relative w-full aspect-[16/9] overflow-hidden ${rounded} border border-gray-200 bg-gray-50 select-none`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={current}
          alt={`${altPrefix} ${index + 1} de ${total}`}
          className="w-full h-full object-contain bg-white"
          draggable={false}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== FALLBACK_MAIN) el.src = FALLBACK_MAIN;
          }}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
              onClick={() => go(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
              onClick={() => go(1)}
            >
              ›
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir a la imagen ${i + 1}`}
                  className={`h-2 w-2 rounded-full ${i === index ? "bg-violet-600" : "bg-gray-300 hover:bg-gray-400"}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (scroll horizontal si hay muchas) */}
      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {images.map((src, i) => {
            const isActive = i === index;
            return (
              <button
                key={`${src}-${i}`}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border ${
                  isActive ? "border-violet-500 ring-2 ring-violet-200" : "border-gray-200"
                }`}
                onClick={() => setIndex(i)}
                aria-label={`Seleccionar imagen ${i + 1}`}
                type="button"
              >
                <img
                  src={src}
                  alt={`${altPrefix} miniatura ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.src !== FALLBACK_THUMB) el.src = FALLBACK_THUMB;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}