// src/features/marketplace/ui/CrearPublicacionPage.tsx
import { useMemo } from 'react'
import { Sidebar } from './components/Sidebar'
import { CreatePostForm } from './components/create-post/CreatePostForm'

export default function CrearPublicacionPage() {
  // (Opcional) breadcrumbs o título dinámico
  const title = useMemo(() => 'Crear publicación', [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Sidebar fijo en desktop */}
      <aside className="border-r">
        <Sidebar active="crear" />
      </aside>
      {/* Contenido */}
      <div className="min-w-0">
        {/* Header simple pegado arriba */}
        <header className="sticky top-0 z-10 backdrop-blur border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">Completa los campos y publica tu producto</p>
          </div>
        </header>

        {/* Formulario */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CreatePostForm />
        </main>
      </div>
    </div>
  )
}
