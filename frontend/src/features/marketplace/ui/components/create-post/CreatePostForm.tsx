import React, { useMemo, useState } from "react";
import { formatCLP } from "../../../utils/format";
import { LabeledInput, LabeledNumber, LabeledSelect, LabeledTextArea } from "./fields";
import { ImageUploader } from "./ImageUploader";

const CAMPUS = ["San Juan Pablo II", "San Francisco"] as const;

type Errors = Partial<Record<"titulo" | "precio" | "stock" | "descripcion" | "campus", string>>;

export function CreatePostForm() {
  const [descripcion, setDescripcion] = useState("");
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState<string>("");
  const [campus, setCampus] = useState<(typeof CAMPUS)[number]>(CAMPUS[0]);
  const [stock, setStock] = useState<string>("");
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pricePreview = useMemo(() => formatCLP(precio || 0), [precio]);

  const onImageFile = (file: File | null) => {
    if (!file) return setPreviewURL(null);
    const url = URL.createObjectURL(file);
    setPreviewURL((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const validate = (): Errors => {
    const e: Errors = {};
    const p = Number(precio);
    const s = Number(stock);

    if (!titulo.trim()) e.titulo = "Ingresa un título";
    if (!precio.trim()) e.precio = "Ingresa un precio";
    else if (Number.isNaN(p) || p < 0 || p > 999999999) e.precio = "Precio inválido";

    if (!stock.trim()) e.stock = "Ingresa el stock";
    else if (!Number.isInteger(s) || s < 0) e.stock = "Stock debe ser un entero ≥ 0";
    else if (!Number.isInteger(s) || s > 100000) e.stock = "Stock muy grande";
    
    if (!descripcion.trim() || descripcion.trim().length < 10)
      e.descripcion = "Describe el producto (mín. 10 caracteres)";

    if (descripcion.trim().length > 1500)
      e.descripcion = "La descripción es muy larga (máx. 1500 caracteres)";

    if (!campus) e.campus = "Selecciona un campus";

    return e;
  };

  async function submitCreatePost(data: any) {
    // Reemplazar esto por axios real
    // const res = await fetch("/api/posts", { method: "POST", body: JSON.stringify(data), headers: {"Content-Type":"application/json"} });
    // if (!res.ok) throw new Error("Error al publicar");
    await new Promise((r) => setTimeout(r, 1200));
    return { ok: true };
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length > 0) {
      // Lleva foco al primer error
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: Number(precio),
        stock: Number(stock),
        campus,
        // imagen: previewURL, // manejar imagenes luego
      };

      const res = await submitCreatePost(payload);
      if (!(res as any).ok) throw new Error("No se pudo publicar");

      setSuccessMsg("¡Publicación creada!");
      // Limpia el formulario (opcional)
      setTitulo("");
      setDescripcion("");
      setPrecio("");
      setStock("");
      setPreviewURL(null);
    } catch (err: any) {
      setFormError(err?.message || "Error inesperado. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <form
        className="bg-slate-50 border border-gray-200 rounded-xl p-4 min-w-0"
        onSubmit={onSubmit}
        noValidate
        aria-busy={isSubmitting}
      >
        {formError && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {formError}
          </div>
        )}
        {successMsg && (
          <div className="mb-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {successMsg}
          </div>
        )}

        {/* Descripción */}
        <section className="grid gap-1.5 mb-5 rounded-xl p-4 border border-gray-200">
          <label className="text-sm font-semibold text-gray-700">Descripción</label>
            <LabeledTextArea
            value={descripcion}
            onChange={setDescripcion}
            placeholder="Escribe una descripción detallada de tu producto..."
            rows={6}
            disabled={isSubmitting}
            error={errors.descripcion}
            maxLength={1000}
            />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 min-w-0">
          {/* Columna izquierda */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end min-w-0">
            <div className="md:col-span-12">
                <LabeledInput
                label="Título"
                value={titulo}
                onChange={setTitulo}
                placeholder="Ej. Libro Cálculo I"
                disabled={isSubmitting}
                error={errors.titulo}
                maxLength={100}
                />
            </div>

            <div className="md:col-span-12">
                <LabeledNumber
                label="Precio"
                value={precio}
                onChange={setPrecio}
                placeholder="Ej. 10000"
                min={0}
                max={999_999_999}
                step={1}
                disabled={isSubmitting}
                error={errors.precio}
                />
            </div>

            {/* Fila: Campus + Stock + Publicar */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-7">
                <LabeledSelect
                  label="Campus"
                  value={campus}
                  onChange={(v) => setCampus(v as any)}
                  options={CAMPUS.map((c) => ({ label: c, value: c }))}
                  className="w-full"
                  disabled={isSubmitting}
                  error={errors.campus}
                />
              </div>

              <div className="md:col-span-2">
                <LabeledNumber
                label="Stock"
                value={stock}
                onChange={setStock}
                placeholder="0"
                min={0}
                max={10_000}
                step={1}
                disabled={isSubmitting}
                error={errors.stock}
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="h-11 w-full rounded-full px-4 border-2 border-violet-500 bg-violet-500 text-black opacity-80 font-medium hover:brightness-95 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publicando…" : "Publicar"}
                </button>
              </div>
            </div>
          </div>

          {/* Columna derecha (vista previa) */}
          <div className="grid gap-2.5 content-end min-w-0">
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-200">
              {previewURL ? (
                <img src={previewURL} alt="Vista previa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-lime-200" />
              )}
            </div>

            <div className="flex items-center justify-between text-gray-500 text-xs px-0.5">
              <span className="font-semibold text-gray-700">Vista Previa</span>
              <span className="font-extrabold text-gray-900">{precio ? pricePreview : ""}</span>
            </div>

            <ImageUploader label="Imagen" onFile={onImageFile} disabled={isSubmitting} />
          </div>
        </div>
      </form>

      {/* Overlay de carga */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm">
          <div className="w-[min(400px,92vw)] rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 size-10 rounded-full border-4 border-violet-500/30 border-t-violet-600 animate-spin" />
            <h3 className="text-lg font-bold">Enviando publicación…</h3>
            <p className="text-sm text-slate-500">No cierres esta ventana.</p>
          </div>
        </div>
      )}

      {/* Región aria-live para mensajes */}
      <p className="sr-only" aria-live="polite">
        {isSubmitting ? "Enviando" : successMsg ? "Publicación creada" : formError ? "Error" : ""}
      </p>
    </div>
  );
}
