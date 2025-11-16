import styles from './StatusBadge.module.css'

type Props = { status: 'ok'|'warn'|'err'; label: string }

export default function StatusBadge({ status, label }: Props) {
  return (
    <span className={styles.pill}>
      <span className={`${styles.dot} ${styles[status]}`}/> {label}
    </span>
  )
}
