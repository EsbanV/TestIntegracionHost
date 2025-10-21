import React, { useRef, useState } from "react";

type TagInputProps = {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  maxTags?: number;
  placeholder?: string;
  error?: string;
};

export function TagInput({
  label = "Etiquetas",
  tags,
  onChange,
  disabled,
  maxTags = 10,
  placeholder = "Escribe y presiona Enter…",
  error,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Determina si se alcanzó el límite de etiquetas
  const isMaxTagsReached = maxTags && tags.length >= maxTags;
  
  const addTag = (raw: string) => {
    const newTag = raw.trim();
    if (
      !newTag ||
      tags.includes(newTag) ||
      isMaxTagsReached || // Usa la variable booleana
      newTag.length > 32
    ) {
      // Opcional: podrías mostrar un mensaje de error si se excede el límite
      return;
    }
    onChange([...tags, newTag]);
    setInput("");
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" ||
      e.key === "," ||
      e.key === "Tab"
    ) {
      e.preventDefault();
      if (input) addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      // Si el input está vacío y presionas backspace, elimina el último tag
      removeTag(tags.length - 1);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Esto evita que se peguen caracteres no deseados o lógica compleja de una sola vez
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",")) {
      e.preventDefault();
      pasted.split(",").map(s => s.trim()).forEach(addTag);
    }
  };

  // Se fuerza a true/false para el tipado correcto
  const inputIsDisabled = Boolean(disabled || isMaxTagsReached);


  return (
    <div>
      {/* Usamos el ID para enlazar el label con el input */}
      {label && (
        <label 
          htmlFor="tag-input-field" 
          className="block text-sm font-semibold text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      {/* Contenedor principal con enfoque visual */}
      <div
        className={`flex flex-wrap gap-1 rounded-lg border bg-white px-2 py-1 min-h-[40px] transition duration-150 ${
            error ? "border-rose-500 ring-1 ring-rose-500" : 
            disabled ? "border-gray-100 bg-gray-50 cursor-not-allowed" : 
            "border-gray-200 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500"
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={tag + idx}
            className="flex items-center bg-violet-100 text-violet-800 rounded px-2 py-0.5 text-xs font-semibold gap-1"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-violet-700 hover:text-rose-600 font-bold px-1 focus:outline-none disabled:opacity-50"
              onClick={() => removeTag(idx)}
              disabled={inputIsDisabled} // Usamos la variable booleana aquí
              aria-label={`Eliminar etiqueta ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        {/* El input donde se corrigió el tipado para evitar el error TS2322 */}
        <input
          id="tag-input-field"
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onInputKeyDown}
          onPaste={onPaste}
          placeholder={tags.length === 0 ? placeholder : isMaxTagsReached ? "Límite alcanzado" : ""}
          className="flex-1 min-w-[80px] border-none outline-none bg-transparent text-sm py-1 disabled:cursor-not-allowed"
          disabled={inputIsDisabled} // <<-- LÍNEA CORREGIDA PARA SIEMPRE DEVOLVER BOOLEAN
          maxLength={32}
        />
      </div>
      {(error || isMaxTagsReached) && ( // Muestra error o advertencia de límite
        <div className="text-xs text-rose-600 font-semibold mt-1">
            {error || (isMaxTagsReached ? `Límite de ${maxTags} etiquetas alcanzado.` : null)}
        </div>
      )}
    </div>
  );
}
