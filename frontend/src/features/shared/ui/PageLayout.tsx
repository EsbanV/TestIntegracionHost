// src/shared/ui/PageLayout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import FloatingChat from './FloatingChat'

export default function PageLayout() {
  const { pathname } = useLocation()
  const isDM = pathname.startsWith('/chats')
  const showFloatingChat = !isDM

  return (
    <div className="grid h-screen grid-rows-[auto,1fr] min-h-screen">
      

      {/* En /chats: ocultamos scroll global para evitar doble scroll.
          En el resto: habilitamos scroll vertical en <main>. */}
      <main className={isDM ? 'min-h-0 overflow-hidden pb-14' : 'min-h-0 overflow-y-auto pb-14'}>
        <div className="min-h-0">
          <Outlet />
        </div>
      </main>

      {showFloatingChat && <FloatingChat width={360} height={560} corner="right" />}
    </div>
  )
}
