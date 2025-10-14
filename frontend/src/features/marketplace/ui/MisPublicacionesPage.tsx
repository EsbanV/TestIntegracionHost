import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

// ajusta las rutas si no usas alias "@"
import { Sidebar } from './components/Sidebar'
import MyPublicationsFeed from './components/MyPublicationsFeed'

export default function MisPublicacionesPage() {
  // Si tienes auth, toma el id real del usuario logueado
  const authorId = useMemo<string | undefined>(() => {
    return localStorage.getItem('userId') ?? undefined
  }, [])

  const [total, setTotal] = useState(0)

  const handleStats = useCallback((_hasResults: boolean, totalResults: number) => {
    setTotal(totalResults)
  }, [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="border-r">
        <Sidebar active="mis-publicaciones" />
      </aside>

      {/* Contenido */}
      <div className="min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Mis publicaciones</h1>
              <p className="text-sm text-gray-600">{total} resultado{total === 1 ? '' : 's'}</p>
            </div>
            <Link
              to="/crear"
              className="inline-flex items-center rounded-xl border bg-white hover:bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900"
            >
              Crear publicación
            </Link>
          </div>
        </header>

        {/* Feed de mis publicaciones */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MyPublicationsFeed
            authorId={authorId}
            onStatsChange={handleStats}
            // Si quieres interceptar el click de editar:
            // onEdit={(id) => navigate(`/mis-publicaciones/editar/${id}`)}
          />
        </main>
      </div>
    </div>
  )
}
