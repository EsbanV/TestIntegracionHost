type Common = { label?: string; className?: string; error?: string; help?: string; disabled?: boolean };

// ✨ LabeledInput — ahora soporta maxLength y corta al llegar al límite
export function LabeledInput({
  label, value, onChange, placeholder, className, error, help, disabled, maxLength,
}: Common & { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value ?? "";
    if (typeof maxLength === "number" && v.length > maxLength) v = v.slice(0, maxLength);
    onChange(v);
  };
  return (
    <div className={"grid gap-1.5 " + (className ?? "") }>
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <input
        className={[
          "h-14 w-full rounded-xl border bg-white px-3 outline-none transition",
          "focus:ring-2 focus:ring-violet-300 focus:border-violet-400",
          disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : "",
          error ? "border-rose-300" : "border-gray-200",
        ].join(" ")}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        maxLength={maxLength}
      />
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
      {help && !error && <p className="text-[12px] text-slate-500">{help}</p>}
    </div>
  );
}

// ✨ LabeledNumber — ahora soporta max y lo aplica (clamp); bloquea teclas e/E+-. y scroll
export function LabeledNumber({
  label, value, onChange, placeholder, min, max, step, className, error, help, disabled,
}: Common & { value: string; onChange: (v: string) => void; placeholder?: string; min?: number; max?: number; step?: number; }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    let raw = e.target.value ?? "";
    if (raw === "") { onChange(""); return; }
    raw = raw.replace(/[^0-9]/g, ""); // solo dígitos
    if (raw === "") { onChange(""); return; }
    let num = parseInt(raw, 10);
    if (!Number.isFinite(num)) num = 0;
    if (typeof max === "number" && num > max) num = max;
    if (typeof min === "number" && num < min) num = min;
    onChange(String(num));
  };
  const blockKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const invalid = ["e","E","+","-","."];
    if (invalid.includes(e.key)) e.preventDefault();
  };
  return (
    <div className={"grid gap-1.5 " + (className ?? "") }>
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <input
        className={[
          "h-14 w-full rounded-xl border bg-white px-3 outline-none transition",
          "focus:ring-2 focus:ring-violet-300 focus:border-violet-400",
          disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : "",
          error ? "border-rose-300" : "border-gray-200",
        ].join(" ")}
        type="number"
        value={value}
        onChange={handleChange}
        onKeyDown={blockKeys}
        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
      {help && !error && <p className="text-[12px] text-slate-500">{help}</p>}
    </div>
  );
}

export function LabeledSelect({ label, value, onChange, options, className, error, help, disabled }: Common & {
  value: string; onChange: (v: string) => void; options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid min-w-0">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <div className={className}>
        <select
          className={[
            "h-10 w-full rounded-xl border bg-white px-2.5 outline-none transition",
            "focus:ring-2 focus:ring-violet-300 focus:border-violet-400",
            disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : "",
            error ? "border-rose-300" : "border-gray-200",
          ].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
      {help && !error && <p className="text-[12px] text-slate-500">{help}</p>}
    </div>
  );
}

// ✨ LabeledTextArea — ahora soporta maxLength y corta al llegar al límite
export function LabeledTextArea({
  value, onChange, placeholder, rows = 4, className, error, help, disabled, maxLength,
}: Common & { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number; }) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let v = e.target.value ?? "";
    if (typeof maxLength === "number" && v.length > maxLength) v = v.slice(0, maxLength);
    onChange(v);
  };
  return (
    <div className={"grid gap-1.5 " + (className ?? "") }>
      <textarea
        className={[
          "w-full resize-y rounded-xl border bg-white p-3 outline-none transition",
          "focus:ring-2 focus:ring-violet-300 focus:border-violet-400",
          disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : "",
          error ? "border-rose-300" : "border-gray-200",
        ].join(" ")}
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        maxLength={maxLength}
      />
      {error && <p className="text-[12px] text-rose-600">{error}</p>}
      {help && !error && <p className="text-[12px] text-slate-500">{help}</p>}
    </div>
  );
}
