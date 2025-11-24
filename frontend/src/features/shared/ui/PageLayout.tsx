import { Outlet, useLocation } from 'react-router-dom'
import FloatingChat from '@/features/DM/FloatingChat'
import Header from './Header'
import { Sidebar } from './Sidebar'

interface PageLayoutProps {
  /** Muestra u oculta la barra lateral. Default: true */
  showSidebar?: boolean
  /** Muestra u oculta la barra superior. Default: true */
  showHeader?: boolean
  /** Habilita el widget de chat flotante. Default: true */
  showFloatingChat?: boolean
}

export default function PageLayout({
  showSidebar = true,
  showHeader = true,
  showFloatingChat = true,
}: PageLayoutProps) {
  const { pathname } = useLocation()

  // Detectar si estamos en la vista de chat completa
  const isDM = pathname.startsWith('/chats')
  const shouldRenderFloatingChat = showFloatingChat && !isDM

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden">
      {/* 1. Sidebar / Bottom bar (se encarga sola de la responsividad) */}
      {showSidebar && <Sidebar />}

      {/* 2. Contenedor Principal */}
      <div
        className="
          flex flex-1 flex-col min-w-0 min-h-0
          transition-all duration-300
        "
      >
        {/* Header superior */}
        {showHeader && <Header />}

        {/* Área de contenido */}
        <main
          className={`
            flex-1 min-h-0 w-full relative flex flex-col
            ${
              isDM
                ? 'overflow-hidden'
                : 'overflow-y-auto p-4 md:p-6 scroll-smooth'
            }
            ${
              showSidebar
                ? 'pb-20 lg:pb-0' // deja espacio para la bottom bar en móvil
                : ''
            }
          `}
        >
          <Outlet />
        </main>
      </div>

      {/* 3. Chat Flotante */}
      {shouldRenderFloatingChat && <FloatingChat />}
    </div>
  )
}
