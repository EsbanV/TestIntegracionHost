import { ReactNode } from 'react';
import styles from './AdminLayout.module.css';
import Sidebar from './Sidebar';
import Header from './Header';

type Props = {
  children: ReactNode;
  title?: string;
};

export default function AdminLayout({ children, title }: Props) {
  return (
    <div className={styles.root}>
      <Sidebar />
      <div className={styles.main}>
        <Header title={title} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}