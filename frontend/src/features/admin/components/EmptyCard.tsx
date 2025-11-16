import styles from './EmptyCard.module.css'
import { ReactNode } from 'react'

export type Row = { icon?: ReactNode; label: ReactNode; content: ReactNode }

type Props = {
  title?: ReactNode
  rows: Row[]
}

export default function EmptyCard({ title, rows }: Props) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.header}>{title}</div>}
      <table className={styles.table}>
        <thead>
          <tr className={styles.row}>
            <th className={`${styles.cell} ${styles.muted}`}>Tarjeta</th>
            <th className={`${styles.cell} ${styles.muted}`}>Contenido</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr className={styles.row} key={i}>
              <td className={`${styles.cell} ${styles.label}`}>{r.icon && <span className={styles.icon}>{r.icon}</span>} {r.label}</td>
              <td className={styles.cell}>{r.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
