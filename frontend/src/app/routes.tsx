import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/ui'
import HomePage from '../features/marketplace/ui/HomePage.tsx'
import CrearPublicacionPage from '../features/marketplace/ui/CrearPublicacionPage.tsx'
import MisPublicacionesPage from '../features/marketplace/ui/MisPublicacionesPage.tsx'
import PerfilPage from '../features/marketplace/ui/PerfilPage.tsx'
import PageLayout from '../features/shared/ui/PageLayout.tsx'
import ChatPage from '../features/chat/pages/ChatPage.tsx'
import AboutPage from '../features/shared/ui/AboutPage.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<PageLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/crear" element={<CrearPublicacionPage />} />
          <Route path="/mis-publicaciones" element={<MisPublicacionesPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/chats" element={<ChatPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
