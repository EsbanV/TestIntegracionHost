import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { RatingStars } from './RatingStars'
import { formatInt, formatCLP } from '@/features/Perfil/Perfil.Utils/format'
import { usePostsWithFilters } from '@/features/Perfil/Perfil.Hooks/usePostWithFilters'

type MyPublicationsFeedProps = {
  searchTerm?: string
  selectedCategoryId?: string
  authorId?: string        // si tu hook filtra por autor
  onStatsChange?: (hasResults: boolean, totalResults: number) => void
  onEdit?: (postId: string) => void // si lo pasas, reemplaza el <Link> por callback
}

const MyPublicationsFeed: React.FC<MyPublicationsFeedProps> = ({
  searchTerm = '',
  selectedCategoryId = '',
  authorId,
  onStatsChange,
  onEdit
}) => {
  const observer = useRef<IntersectionObserver | null>(null)
  const lastPostElementRef = useRef<HTMLDivElement | null>(null)

  const {
    posts,
    hasResults,
    totalResults,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = usePostsWithFilters({
    searchTerm: searchTerm.trim(),
    categoryId: selectedCategoryId,
    authorId,          // ⚠️ si tu hook no soporta esto, elimínalo o adapta
    onlyMine: true     // idem: si tu hook soporta esta flag, genial; si no, remuévela
  } as any)

  useEffect(() => {
    if (onStatsChange && !isLoading) onStatsChange(hasResults, totalResults)
  }, [hasResults, totalResults, isLoading, onStatsChange])

  useEffect(() => {
    if (isLoading || isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.5, rootMargin: '200px' }
    )
    if (lastPostElementRef.current) observer.current.observe(lastPostElementRef.current)
    return () => observer.current?.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, posts.length])

  const categoryNames: Record<string, string> = {
    electronics: 'Electrónicos',
    books: 'Libros y Materiales',
    clothing: 'Ropa y Accesorios',
    sports: 'Deportes',
    home: 'Hogar y Jardín',
    vehicles: 'Vehículos',
    services: 'Servicios'
  }

  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
      <div className="text-8xl mb-6">📭</div>
      <h3 className="text-2xl font-semibold mb-3 text-gray-700">Aún no tienes publicaciones</h3>
      <p className="text-center max-w-md text-gray-600 leading-relaxed">
        Crea tu primera publicación desde “Crear”.
      </p>
    </div>
  )

  const InitialLoadingState = () => (
    <div className="col-span-full flex items-center justify-center py-20">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6" />
        <p className="text-gray-600 text-lg">Cargando tus publicaciones…</p>
      </div>
    </div>
  )

  const PostSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-2 00 overflow-hidden animate-pulse">
      <div className="relative aspect-video w-full bg-gray-300" />
      <div className="p-4 md:p-5">
        <div className="flex items-center mb-3 md:mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 mr-3" />
          <div className="flex-1">
            <div className="h-3 md:h-4 bg-gray-300 rounded w-24 mb-1" />
            <div className="h-2 md:h-3 bg-gray-300 rounded w-16" />
          </div>
        </div>
        <div className="h-4 md:h-5 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 md:h-5 bg-gray-300 rounded w-3/4 mb-3" />
        <div className="h-3 md:h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-3 md:h-4 bg-gray-300 rounded w-5/6 mb-2" />
        <div className="h-3 md:h-4 bg-gray-300 rounded w-2/3 mb-4" />
        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
          <div className="h-3 md:h-4 bg-gray-300 rounded w-24" />
          <div className="h-3 md:h-4 bg-gray-300 rounded w-16" />
        </div>
      </div>
    </div>
  )

  const LoadingMoreSkeleton = () => (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <PostSkeleton key={`skeleton-${i}`} />
      ))}
    </>
  )

  const ErrorState = () => (
    <div className="col-span-full mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <div className="text-red-400 mr-4 text-2xl">⚠️</div>
        <div>
          <h4 className="text-red-800 font-medium text-lg">Error al cargar tus publicaciones</h4>
          <p className="text-red-600 text-sm mt-1">
            {error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {!isLoading && (
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {posts.length > 0 ? (
              <>
                Mostrando {posts.length} publicación{posts.length !== 1 ? 'es' : ''} propias
                {(searchTerm || selectedCategoryId) && (
                  <span className="ml-2">
                    {searchTerm && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-2 font-medium">
                        🔍 "{searchTerm}"
                      </span>
                    )}
                    {selectedCategoryId && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                        📁 {categoryNames[selectedCategoryId]}
                      </span>
                    )}
                  </span>
                )}
              </>
            ) : hasResults ? (
              'Cargando resultados...'
            ) : (
              'No tienes resultados para mostrar'
            )}
          </div>
        </div>
      )}

      {isError && <ErrorState />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <InitialLoadingState />
        ) : !hasResults ? (
          <EmptyState />
        ) : (
          <>
            {posts.map((post: any, index: number) => {
              const rating = post.sellerRating ?? post.rating ?? 0
              const sales = post.sellerSales ?? post.sales

              return (
                <div
                  key={`${post.id}-${searchTerm}-${selectedCategoryId}`}
                  ref={index === posts.length - 1 ? lastPostElementRef : null}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full"
                >
                  {post.image && (
                    <div className="relative aspect-video w-full">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {post.price && (
                        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                          {formatCLP(parseFloat(String(post.price)) || 0)}
                        </div>
                      )}
                      {post.categoryName && (
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/95 text-gray-800 font-medium shadow-sm">
                            {post.categoryName}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 md:p-5">
                    <div className="flex items-center mb-3 md:mb-4">
                      {post.avatar && (
                        <img
                          src={post.avatar}
                          alt={post.author}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-3 border-2 border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs md:text-sm font-medium text-gray-900 truncate">
                          {post.author}
                        </h4>
                        {post.timeAgo && <p className="text-xs text-gray-500">{post.timeAgo}</p>}
                      </div>
                    </div>

                    <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-3 leading-relaxed">
                        {post.description}
                      </p>
                    )}

                    {/* Footer: estrellas + ventas + Editar */}
                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <RatingStars rating={rating} />
                          <span className="font-semibold text-gray-700">
                            {Number(rating || 0).toFixed(1)}
                          </span>
                        </span>
                        {typeof sales !== 'undefined' && (
                          <>
                            <span className="opacity-60">•</span>
                            <span>{formatInt(Number(sales))} ventas</span>
                          </>
                        )}
                      </div>

                      <button
                          className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <Link to="/editar">Editar</Link>
                        </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {isFetchingNextPage && <LoadingMoreSkeleton />}
          </>
        )}
      </div>

      {!hasNextPage && posts.length > 0 && !isFetchingNextPage && posts.length >= 27 && (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="mr-2">✅</span>
            <span>Mostramos todas tus publicaciones</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPublicationsFeed
