import styles from './AdminModal.module.css';
import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave?: () => void;
  children?: ReactNode;
};

export default function AdminModal({ open, title, onClose, onSave, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className={styles.header}>
              <h3>{title}</h3>
              <button className={styles.close} onClick={onClose}>×</button>
            </div>
            <div className={styles.body}>{children}</div>
            <div className={styles.footer}>
              <button className={styles.btn} onClick={onClose}>Cancelar</button>
              {onSave && <button className={`${styles.btn} ${styles.primary}`} onClick={onSave}>Guardar</button>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}