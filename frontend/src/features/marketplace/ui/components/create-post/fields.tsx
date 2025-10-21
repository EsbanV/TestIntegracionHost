import React, { useId } from "react";
import Input from "../../../../../../public/components/Input";
import Textarea from "../../../../../../public/components/Textarea";

/**
 * Wrappers compatibles con el formulario existente.
 * Mantienen valores como strings para evitar romper estados.
 */

type BaseProps = {
  id?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  error?: string | null;
  placeholder?: string;
};

type ValueSetter = React.Dispatch<React.SetStateAction<string>>;
type ValueHandler = (v: string) => void;

function callWithValue(handler: ValueSetter | ValueHandler | undefined, value: string) {
  if (!handler) return;
  // handler puede ser setState (ValueSetter) o una función (ValueHandler)
  try {
    (handler as ValueSetter)(value);
  } catch {
    try {
      (handler as ValueHandler)(value);
    } catch {
      // Seguro por si acaso: no hacer nada
    }
  }
}

/**
 * Evitar extender directamente React.InputHTMLAttributes porque contiene onChange:
 * eso provoca que el tipo esperado sea la intersección (conflictiva) entre ChangeEventHandler y nuestro ValueSetter.
 * En su lugar usamos Omit para heredar atributos útiles excepto onChange/value/placeholder.
 */
type InputPropsBase = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "placeholder">;
type TextareaPropsBase = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "placeholder">;

export function LabeledInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = "",
  disabled,
  error,
  ...rest
}: BaseProps &
  InputPropsBase & {
    value: string;
    onChange?: ValueSetter | ValueHandler;
  }) {
  const generated = useId();
  const fieldId = id ?? `input-${generated}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    callWithValue(onChange, e.target.value);
  };

  return (
    <div className={`form-control ${className}`}>
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      ) : null}
      <Input
        id={fieldId}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        {...(rest as any)}
      />
    </div>
  );
}

export function LabeledNumber({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = "",
  disabled,
  error,
  min,
  max,
  step,
  ...rest
}: BaseProps & {
  value: string; // mantenemos string por compatibilidad con el estado actual
  onChange?: ValueSetter | ValueHandler;
  min?: number;
  max?: number;
  step?: number;
} & InputPropsBase) {
  const generated = useId();
  const fieldId = id ?? `number-${generated}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    callWithValue(onChange, e.target.value);
  };

  return (
    <div className={`form-control ${className}`}>
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      ) : null}
      <Input
        id={fieldId}
        type="number"
        value={String(value ?? "")}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        min={min}
        max={max}
        step={step}
        {...(rest as any)}
      />
    </div>
  );
}

export function LabeledTextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = "",
  disabled,
  error,
  rows,
  maxLength,
  ...rest
}: BaseProps & {
  value: string;
  onChange?: ValueSetter | ValueHandler;
  rows?: number;
  maxLength?: number;
} & TextareaPropsBase) {
  const generated = useId();
  const fieldId = id ?? `textarea-${generated}`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    callWithValue(onChange, e.target.value);
  };

  return (
    <div className={`form-control ${className}`}>
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      ) : null}
      <Textarea
        id={fieldId}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        minRows={rows}
        maxLength={maxLength}
        {...(rest as any)}
      />
    </div>
  );
}

export function LabeledSelect<T extends string | number>({
  id,
  label,
  value,
  onChange,
  options,
  className = "",
  disabled,
  name,
  ...rest
}: BaseProps & {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  name?: string;
}) {
  const generated = useId();
  const fieldId = id ?? `select-${generated}`;
  return (
    <div className={`form-control ${className}`}>
      {label ? (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      ) : null}
      <select
        id={fieldId}
        name={name}
        value={value as any}
        onChange={(e) => onChange(e.target.value as any)}
        disabled={disabled}
        className="block w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        {...(rest as any)}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value as any}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default {
  LabeledInput,
  LabeledNumber,
  LabeledSelect,
  LabeledTextArea,
};
