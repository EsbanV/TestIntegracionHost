import React, { useRef } from "react";

type MultiImageUploaderProps = {
  label?: string;
  images: File[];
  onImagesChange: (files: File[]) => void;
  disabled?: boolean;
  maxImages?: number;
};

export function MultiImageUploader({
  label = "Imágenes",
  images,
  onImagesChange,
  disabled,
  maxImages = 5,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = Array.from(e.target.files ?? []);
    // Concatena con las imágenes existentes, pero limita a maxImages
    const allFiles = [...images, ...files].slice(0, maxImages);
    onImagesChange(allFiles);
    // Limpia el input para permitir subir la misma imagen otra vez si se quiere
    e.target.value = "";
  };

  const removeAt = (idx: number) => {
    const newImages = images.slice();
    newImages.splice(idx, 1);
    onImagesChange(newImages);
  };

  return (
    <div>
      <label
        className={[
          "inline-grid place-items-center h-9 rounded-xl border bg-white font-bold select-none px-3 mb-2",
          disabled ? "opacity-60 cursor-not-allowed border-gray-200" : "cursor-pointer border-gray-200",
        ].join(" ")}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={onChange}
          disabled={disabled || images.length >= maxImages}
        />
        {label} {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>
      <div className="flex gap-2 flex-wrap mt-2">
        {images.map((file, idx) => {
          const url = URL.createObjectURL(file);
          return (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Imagen ${idx + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                onLoad={() => URL.revokeObjectURL(url)}
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-white/80 rounded-full px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-200 opacity-80 hover:opacity-100"
                onClick={() => removeAt(idx)}
                aria-label={`Eliminar imagen ${idx + 1}`}
                tabIndex={0}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}