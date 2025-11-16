import styles from './Sidebar.module.css';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>Admin</div>
      <nav className={styles.nav}>
        <NavLink className={({isActive}) => `${styles.link} ${isActive ? styles.active : ''}`} to="/admin" end>Dashboard</NavLink>
        <NavLink className={({isActive}) => `${styles.link} ${isActive ? styles.active : ''}`} to="/admin/usuarios">Usuarios</NavLink>
        <NavLink className={({isActive}) => `${styles.link} ${isActive ? styles.active : ''}`} to="/admin/publicaciones">Publicaciones</NavLink>
        <NavLink className={({isActive}) => `${styles.link} ${isActive ? styles.active : ''}`} to="/admin/marketplace">Marketplace</NavLink>
        <NavLink className={({isActive}) => `${styles.link} ${isActive ? styles.active : ''}`} to="/admin/ajustes">Ajustes</NavLink>
      </nav>
    </aside>
  );
}