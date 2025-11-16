import styles from './AdminTable.module.css';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export type Column<T> = {
  key: string;
  title: string;
  render?: (item: T) => ReactNode;
  width?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  rowKey?: (item: T) => string | number;
  loading?: boolean;
  emptyContent?: ReactNode;
};

export default function AdminTable<T>({ columns, data, onRowClick, rowKey, loading, emptyContent }: Props<T>) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }).map((_, idx) => (
            <tr key={`skeleton-${idx}`}>
              {columns.map((c) => (
                <td key={c.key}><div className={styles.skeletonBar} style={{ width: `${60 + (idx*5)%30}%` }} /></td>
              ))}
            </tr>
          ))}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                {emptyContent ?? <div style={{ padding: 16, color: '#64748b' }}>Sin datos para mostrar.</div>}
              </td>
            </tr>
          )}

          {!loading && data.map((item, idx) => {
            const key = rowKey ? rowKey(item) : idx;
            return (
              <motion.tr
                key={String(key)}
                className={onRowClick ? styles.clickable : ''}
                onClick={() => onRowClick?.(item)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                whileHover={{ scale: 1.002 }}
              >
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(item) : (item as any)[c.key]}
                  </td>
                ))}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}