import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/app/context/AuthContext'
import { RequireSetup } from '@/app/context/RequireOnboarding'
import AdminRoute from '../components/auth/AdminRoute';

// Layout
import PageLayout from '@/features/shared/ui/PageLayout'

// Pages
import LoginPage from '@/features/Login/LoginPage'
import RegisterTest from '@/features/Login/Login.UI/RegisterTest'
import LoginTest from '@/features/Login/Login.UI/LoginTest'
import HomePage from '@/features/Marketplace/HomePage'
import CreateProductPage from '@/features/CrearPublicacion/CrearPublicacion.UI/CrearPublicacionPage' // Corregí el nombre del archivo según el último paso
import PerfilPage from '@/features/Perfil/PerfilPage'
import ChatPage from '@/features/DM/ChatPage'
import AyudaPage from '@/features/About.Terms.Help/Help.UI/AyudaPage'
import TermsPage from '@/features/About.Terms.Help/Terms.UI/TermsPage'
import AboutPage from '@/features/About.Terms.Help/About.UI/AboutPage'
import OnboardingPage from '@/features/Onboarding/OnboardingPage'
import EditarPublicacionPage from '@/features/EditarPublicacion/EditarPublicacion.UI/EditarPublicacionPage'
import MyProductsPage from '@/features/MyPublications/MyPublications.UI/MisPublicacionesPage'
import ForumPage from '@/features/Forum/ForumPage'
import MyPublicationsPage from '@/features/Forum/MyPublicationsPage'
import FavoritesPage from '@/features/Favoritos/FavoritesPage'

import UsersPage from '../features/admin/pages/UsersPage';
import AdminDashboardPage from '../features/admin/pages/DashboardPage';
import AdminPostsPage from '../features/admin/pages/PostsPage';
import AdminSettingsPage from '../features/admin/pages/SettingsPage';
import AdminMarketplacePage from '../features/admin/pages/MarketplacePage';
import AdminProductsPage from '../features/admin/pages/AdminProductsPage';


export function AppRoutes() {
  return (
    <Routes>
      {/* =========================================
          1. RUTAS PÚBLICAS (Sin Layout)
          ========================================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterTest />} />
      <Route path="/login-test" element={<LoginTest />} />
      <Route path="/about" element={<AboutPage />} />

      {/* =========================================
          2. RUTAS PÚBLICAS CON LAYOUT
          ========================================= */}
      <Route element={<PageLayout showHeader={true} showSidebar={true} />}>
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="/terminos" element={<TermsPage />} />
      </Route>

      {/* =========================================
          3. ZONA PROTEGIDA (Requiere Login)
          ========================================= */}
      <Route element={<ProtectedRoute />}>
        
        {/* 🚨 EXCEPCIÓN: ONBOARDING
            Esta ruta debe estar protegida por login, pero FUERA del RequireSetup
            para evitar bucles infinitos. Además, suele verse mejor sin el Sidebar.
        */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* 🛡️ ZONA DE USUARIOS VERIFICADOS (Requiere Setup Completo) 
            Si el usuario no tiene campus, RequireSetup lo mandará a /onboarding
        */}
        <Route element={<RequireSetup />}>

            {/* GRUPO A: Layout Estándar (Marketplace, Perfil, etc.) */}
            <Route 
              element={
                <PageLayout 
                  showHeader={true} 
                  showSidebar={true} 
                  showFloatingChat={true} 
                />
              }
            >
              <Route path="/home" element={<HomePage />} />
              <Route path="/crear" element={<CreateProductPage />} />
              <Route path="/mis-publicaciones" element={<MyProductsPage />} />
              <Route path="/perfil/" element={<PerfilPage />} />
              <Route path="/perfil/:id" element={<PerfilPage />} />
              <Route path="/editar" element={<EditarPublicacionPage />} />
              <Route path="/mis-foros" element={<MyPublicationsPage />} />
              <Route path="/forums" element={<ForumPage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />
              
              {/* Rutas pendientes o placeholders */}
              {/* <Route path="/editar" element={<EditarPublicacionPage />} /> */}
              {/* <Route path="/mis-foros" element={<MyPublicationsPage />} /> */}
              {/* <Route path="/forums" element={<ForumPage />} /> */}
            </Route>

            {/* GRUPO B: Layout de Chat (Pantalla completa) */}
            <Route 
              element={
                <PageLayout 
                  showHeader={false} 
                  showSidebar={true} 
                  showFloatingChat={false} 
                />
              }
            >
              <Route path="/chats" element={<ChatPage />} />
            </Route>

        </Route> {/* Fin RequireSetup */}

        {/* --- Rutas de Administrador (Requiere rol 'ADMIN') --- */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/usuarios" element={<UsersPage />} />
          <Route path="/admin/publicaciones" element={<AdminPostsPage />} />
          <Route path="/admin/ajustes" element={<AdminSettingsPage />} />
          <Route path="/admin/marketplace" element={<AdminMarketplacePage />} />
          <Route path="/admin/productos" element={<AdminProductsPage />} />
        </Route>

      </Route> {/* Fin ProtectedRoute */}

      {/* =========================================
          4. REDIRECCIONES
          ========================================= */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />


    </Routes>



  )
}

export default AppRoutes