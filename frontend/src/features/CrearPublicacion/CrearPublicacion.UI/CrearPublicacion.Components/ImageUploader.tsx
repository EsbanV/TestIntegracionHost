import React from "react";

export function ImageUploader({ label = "Imagen", onFile, disabled }: { label?: string; onFile: (file: File | null) => void; disabled?: boolean }) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0] ?? null;
    onFile(file);
  };

  return (
    <label
      className={[
        "inline-grid place-items-center h-9 rounded-xl border bg-white font-bold select-none px-3",
        disabled ? "opacity-60 cursor-not-allowed border-gray-200" : "cursor-pointer border-gray-200",
      ].join(" ")}
      aria-disabled={disabled}
    >
      <input type="file" accept="image/*" className="sr-only" onChange={onChange} disabled={disabled} />
      {label}
    </label>
  );
}