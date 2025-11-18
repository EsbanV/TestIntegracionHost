import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

type Props = {
  children: ReactNode;
  title?: string;
};

export default function AdminLayout({ children, title }: Props) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Fijo */}
      <Sidebar />

      {/* Área Principal */}
      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        <Header title={title} />

        {/* Contenido Scrollable */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Animación de entrada para el contenido */}
            <motion.div
              key={title} // Reinicia la animación si cambia el título (opcional)
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}