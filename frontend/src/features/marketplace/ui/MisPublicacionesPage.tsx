import React from "react";
import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import MyPublicationsFeed from './components/MyPublicationsFeed'
import Header from '../../shared/ui/Header'

export default function MisPublicacionesPage() {
  const authorId = useMemo<string | undefined>(() => localStorage.getItem('userId') ?? undefined, []);
  const [total, setTotal] = useState(0)

  const handleStats = useCallback((_hasResults: boolean, totalResults: number) => {
    setTotal(totalResults)
  }, [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="border-r">
        <Sidebar active="marketplace" />
      </aside>

      <div className="min-w-0">
        <Header/>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Mis publicaciones</h1>
              <p className="text-sm text-gray-600">{total} resultado{total === 1 ? '' : 's'}</p>
            </div>
            <Link
              to="/crear"
              className="inline-flex items-center h-9 rounded-md border bg-white hover:bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900"
            >
              Crear publicación
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MyPublicationsFeed authorId={authorId} onStatsChange={handleStats} />
        </main>
      </div>
    </div>
  )
}
