import styles from './Header.module.css';
import SearchInput from '../components/SearchInput';

type Props = { title?: string };

export default function Header({ title }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title ?? 'Panel de administración'}</h1>
        <span className={styles.breadcrumb}>Administración / {title ?? 'Inicio'}</span>
      </div>
      <div className={styles.actions}>
        <SearchInput placeholder="Buscar..." onChange={() => {}} />
        <div className={styles.user} role="button" aria-label="Menú de usuario">
          <span className={styles.avatar}>AD</span>
          <span className={styles.userName}>Admin</span>
          <svg className={styles.chevron} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </header>
  );
}