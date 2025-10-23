import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/ui'
import HomePage from '../features/Marketplac/Marketplace.UI/HomePage'
import CrearPublicacionPage from '../features/marketplace/ui/CrearPublicacionPage'
import EditarPublicacionPage from '../features/EditarPublicacion/EditarPublicacion.UI/EditarPublicacionPage'
import MisPublicacionesPage from '../features/MyPublications/MyPublications.UI/MisPublicacionesPage'
import PerfilPage from '../features/Perfil/Perfil.UI/PerfilPage'
import PageLayout from '../features/shared/ui/PageLayout'
import ChatPage from '../features/DM/DM.UI/ChatPage'
import AyudaPage from '../features/AcercaDe/AcercaDe.UI/AyudaPage'
import TermsPage from '../features/AcercaDe/AcercaDe.UI/TermsPage'
import AboutPage from '../features/AcercaDe/AcercaDe.UI/AboutPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Redirige la raíz a /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route element={<PageLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/crear" element={<CrearPublicacionPage />} />
        <Route path="/editar" element={<EditarPublicacionPage />} />
        <Route path="/mis-publicaciones" element={<MisPublicacionesPage />} />
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/chats" element={<ChatPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes