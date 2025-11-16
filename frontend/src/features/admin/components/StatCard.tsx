import styles from './StatCard.module.css';
import { motion } from 'framer-motion';

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'positive' | 'negative';
};

export default function StatCard({ title, value, subtitle, variant = 'default' }: Props) {
  return (
    <motion.div
      className={`${styles.card} ${styles[variant]}`}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </motion.div>
  );
}