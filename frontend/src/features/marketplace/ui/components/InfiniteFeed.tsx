import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePostsWithFilters } from '../../../../hooks/usePostsWithFilters'
import { RatingStars } from './RatingStars'
import { formatInt, formatCLP } from '../../utils/format'
import { PostDetailModal, PostDetailData } from './modals/PostDetailModal'

interface InfiniteFeedProps {
  searchTerm: string
  selectedCategoryId: string
  onStatsChange?: (hasResults: boolean, totalResults: number) => void
}

// Agrega placeholders para probar carrusel (puedes desactivar luego)
const AUGMENT_IMAGES_FOR_DEV = true
const DEV_STRESS_LONG_DESC = false

const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  searchTerm = '',
  selectedCategoryId = '',
  onStatsChange
}) => {
  const navigate = useNavigate()
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
    categoryId: selectedCategoryId
  })

  // Modal state
  const [openModal, setOpenModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PostDetailData | null>(null)

  const parsePrice = (v: unknown): number => {
    const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10)
    return Number.isFinite(n) ? n : 0
  }

  const buildDevImages = (seedBase: string, existing: string[]) => {
  if (!AUGMENT_IMAGES_FOR_DEV) return existing
  if ((existing?.length ?? 0) > 1) return existing
  const seed = encodeURIComponent(String(seedBase || 'seed').replace(/\s+/g, '-'))
  const variants = Array.from({ length: 12 }, (_, i) => `https://picsum.photos/seed/${seed}-${i + 1}/1200/675`)
  if (existing?.length === 1) return [existing[0], ...variants]
  return variants
}

  const mapPostToDetail = (post: any): PostDetailData => {
    const baseImages: string[] = post.images ?? (post.image ? [post.image] : [])
    const images = buildDevImages(String(post.id ?? post.title ?? 'post'), baseImages)

    const baseDesc = post.description ?? 'Sin descripción'
    const longAddon =
      DEV_STRESS_LONG_DESC
        ? '\n\n' +
          'Características destacadas:\n' +
          '- Pantalla 15.6" 144Hz\n- GPU RTX 4060\n- 16GB RAM\n- SSD 1TB NVMe\n' +
          '\n'.repeat(2) +
          'Descripción extendida: '.concat(baseDesc, ' ').repeat(20)
        : ''

    return {
      id: String(post.id),
      titulo: post.title ?? 'Sin título',
      descripcion: baseDesc + longAddon,
      precio: parsePrice(post.price),
      stock: post.stock ?? 1,
      campus: post.campus ?? 'San Juan Pablo II',
      categoria: post.categoryName ?? 'Sin categoría',
      condicion: post.condition ?? 'Usado',
      fechaPublicacion: post.publishedAt ?? new Date(),
      imagenes: images,
      vendedor: {
        id: post.sellerId ?? post.authorId ?? undefined,
        nombre: post.author ?? 'Usuario',
        avatarUrl: post.avatar,
        reputacion:
          typeof post.sellerRating === 'number'
            ? post.sellerRating
            : typeof post.rating === 'number'
            ? post.rating
            : undefined
      }
    }
  }

  const onOpenDetail = (post: any) => {
    setSelectedPost(mapPostToDetail(post))
    setOpenModal(true)
  }

  // Punto 4: iniciar chat (ruta correcta: /chats)
  const handleContact = (detail: PostDetailData) => {
    const toId = detail.vendedor?.id ?? undefined
    const toName = detail.vendedor?.nombre ?? ''
    const toAvatar = detail.vendedor?.avatarUrl ?? ''
    const qs = new URLSearchParams()
    if (toId) qs.set('toId', String(toId))
    if (toName) qs.set('toName', toName)
    if (toAvatar) qs.set('toAvatar', toAvatar)

    // IMPORTANTE: usar /chats (plural) tal como está en routes.tsx
    navigate(`/chats${qs.toString() ? `?${qs}` : ''}`, {
      state: { toUser: detail.vendedor }
    })
    setOpenModal(false)
  }

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
      <div className="text-8xl mb-6">🛒</div>
      <h3 className="text-2xl font-semibold mb-3 text-gray-700">No se encontraron productos</h3>
      <p className="text-center max-w-md text-gray-600 leading-relaxed">
        {searchTerm || selectedCategoryId
          ? 'Intenta ajustar tus filtros de búsqueda o explora otras categorías.'
          : 'No hay publicaciones disponibles en este momento.'}
      </p>
    </div>
  )

  const InitialLoadingState = () => (
    <div className="col-span-full flex items-center justify-center py-20">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6" />
        <p className="text-gray-600 text-lg">Cargando publicaciones...</p>
      </div>
    </div>
  )

  const PostSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
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
          <h4 className="text-red-800 font-medium text-lg">Error al cargar las publicaciones</h4>
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
                Mostrando {posts.length} publicación{posts.length !== 1 ? 'es' : ''}
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
              'No hay resultados para mostrar'
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
            {posts.map((post, index) => {
              const rating = (post as any).sellerRating ?? (post as any).rating ?? 0
              const sales = (post as any).sellerSales ?? (post as any).sales

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
                        {post.timeAgo && (
                          <p className="text-xs text-gray-500">{post.timeAgo}</p>
                        )}
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

                    {/* Footer: estrellas + ventas + Ver detalle */}
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
                        type="button"
                        onClick={() => onOpenDetail(post)}
                        className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Ver detalle
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
            <span className="mr-2">🎉</span>
            <span>Has visto todas las publicaciones disponibles</span>
          </div>
        </div>
      )}

      {/* Modal de detalle con acción de contacto */}
      <PostDetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        post={selectedPost}
        onContact={handleContact}
      />
    </div>
  )
}

export default InfiniteFeed