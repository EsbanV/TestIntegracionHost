import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './SuccessModal.module.css'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  campusName?: string
  carreraName?: string
}

export default function SuccessModal({ isOpen, onClose, campusName, carreraName }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay} 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <motion.div 
              className={styles.iconContainer}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <svg className={styles.checkIcon} viewBox="0 0 52 52">
                <circle className={styles.checkCircle} cx="26" cy="26" r="25" fill="none"/>
                <path className={styles.checkPath} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </motion.div>

            <motion.h2 
              className={styles.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              ¡Perfil configurado!
            </motion.h2>
            
            <motion.p 
              className={styles.message}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              Tu información ha sido guardada correctamente
            </motion.p>

            <motion.div 
              className={styles.details}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.div 
                className={styles.detailItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(11, 58, 110, 0.12)" }}
              >
                <svg className={styles.detailIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <span className={styles.detailLabel}>Campus</span>
                  <span className={styles.detailValue}>{campusName}</span>
                </div>
              </motion.div>

              <motion.div 
                className={styles.detailItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(11, 58, 110, 0.12)" }}
              >
                <svg className={styles.detailIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div>
                  <span className={styles.detailLabel}>Carrera</span>
                  <span className={styles.detailValue}>{carreraName}</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.button 
              className={styles.button} 
              onClick={onClose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Continuar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
