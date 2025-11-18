// AdminLayout.tsx
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export default function AdminLayout({ children, title, subtitle }: Props) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        <Header title={title} subtitle={subtitle} />

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Animación de entrada para el contenido */}
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
