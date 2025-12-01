import { Outlet, useLocation } from 'react-router-dom'
import FloatingChat from '@/features/DM/FloatingChat'
import Header from './Header'
import { Sidebar } from './Sidebar'

interface PageLayoutProps {
  showSidebar?: boolean
  showHeader?: boolean
  showFloatingChat?: boolean
}

export default function PageLayout({
  showSidebar = true,
  showHeader = true,
  showFloatingChat = true,
}: PageLayoutProps) {
  const { pathname } = useLocation()
  const isDM = pathname.startsWith('/chats')
  const shouldRenderFloatingChat = showFloatingChat && !isDM

  return (
    // ELIMINADO: bg-slate-50/50. 
    // AGREGADO: bg-background text-foreground (para asegurar herencia del tema)
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      
      {/* Sidebar a la izquierda */}
      {showSidebar && <Sidebar className="hidden md:flex" />}

      {/* Contenedor Principal */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 transition-all duration-300 relative">
        
        {/* Header superior */}
        {showHeader && <Header />}

        {/* Área de contenido */}
        <main
          className={`
            flex-1 min-h-0 w-full relative flex flex-col
            ${isDM ? 'overflow-hidden' : 'overflow-y-auto scroll-smooth'}
            /* Ajuste de padding para separar contenido de los bordes */
            ${!isDM ? 'p-4 md:p-6 lg:p-8' : ''}
            /* Espacio inferior para bottom-bar móvil */
            ${showSidebar ? 'pb-20 md:pb-6 lg:pb-8' : ''}
          `}
        >
          <Outlet />
        </main>
      </div>

      {/* Sidebar Móvil (Bottom Bar) se renderiza dentro de Sidebar component pero fixed */}
      {showSidebar && <div className="md:hidden"><Sidebar /></div>}

      {/* Chat Flotante */}
      {shouldRenderFloatingChat && <FloatingChat />}
    </div>
  )
}