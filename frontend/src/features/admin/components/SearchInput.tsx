import styles from './SearchInput.module.css';

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
};

export default function SearchInput({ value, onChange, placeholder }: Props) {
  return (
    <input
      className={styles.input}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder ?? 'Buscar...'}
      aria-label="Buscar"
    />
  );
}