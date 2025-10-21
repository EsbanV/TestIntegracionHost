import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

// Interfaz para los filtros
interface PostFilters {
  searchTerm: string
  categoryId: string
}

// Interfaz para Post (mantener consistencia)
interface Post {
  id: number
  title: string
  description: string
  categoryId: string
  categoryName: string
  author: string
  avatar: string
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  timeAgo: string
  price?: string
}

// Datos de categorías
const categories = [
  { id: 'electronics', name: 'Electrónicos' },
  { id: 'books', name: 'Libros y Materiales' },
  { id: 'clothing', name: 'Ropa y Accesorios' },
  { id: 'sports', name: 'Deportes' },
  { id: 'home', name: 'Hogar y Jardín' },
  { id: 'vehicles', name: 'Vehículos' },
  { id: 'services', name: 'Servicios' }
]

// Datos de productos
const productData = [
  { title: 'iPhone 14 Pro Max', desc: 'Excelente estado, incluye cargador y caja original', category: 'electronics', priceRange: [800000, 1200000] },
  { title: 'Laptop Gaming ASUS', desc: 'Perfect para gaming y diseño, RTX 4060, 16GB RAM', category: 'electronics', priceRange: [1500000, 2000000] },
  { title: 'Samsung Galaxy S23', desc: 'Como nuevo, sin rayones, batería al 100%', category: 'electronics', priceRange: [600000, 900000] },
  { title: 'MacBook Air M2', desc: 'Ideal para estudiantes, muy poco uso', category: 'electronics', priceRange: [1200000, 1800000] },
  { title: 'Cálculo I - Stewart', desc: 'Libro universitario en perfecto estado, sin marcas', category: 'books', priceRange: [45000, 65000] },
  { title: 'Programación en Java', desc: 'Libro técnico con ejemplos prácticos', category: 'books', priceRange: [35000, 55000] },
  { title: 'Física Universitaria', desc: 'Volumen 1 y 2, ideales para ingeniería', category: 'books', priceRange: [80000, 120000] },
  { title: 'Calculadora Científica HP', desc: 'Modelo HP-35s, perfecta para exámenes', category: 'books', priceRange: [80000, 100000] },
  { title: 'Zapatillas Nike Air Max', desc: 'Talla 42, usadas pocas veces, muy cómodas', category: 'clothing', priceRange: [60000, 90000] },
  { title: 'Chaqueta North Face', desc: 'Impermeable, talla M, ideal para lluvia', category: 'clothing', priceRange: [120000, 180000] },
  { title: 'Reloj Casio G-Shock', desc: 'Resistente al agua, batería nueva', category: 'clothing', priceRange: [80000, 120000] },
  { title: 'Bicicleta de Montaña Trek', desc: 'Aro 29, frenos hidráulicos, excelente estado', category: 'sports', priceRange: [400000, 600000] },
  { title: 'Pelota de Fútbol Nike', desc: 'Oficial FIFA, poco uso, ideal para entrenar', category: 'sports', priceRange: [25000, 35000] },
  { title: 'Raqueta de Tenis Wilson', desc: 'Profesional, incluye funda y overgrips', category: 'sports', priceRange: [80000, 150000] },
  { title: 'Sofá de 3 Cuerpos', desc: 'Muy cómodo, color gris, estado impecable', category: 'home', priceRange: [200000, 350000] },
  { title: 'Mesa de Comedor', desc: 'Madera sólida, para 6 personas, barnizada', category: 'home', priceRange: [150000, 250000] },
  { title: 'Microondas Samsung', desc: '20 litros, funciona perfecto, poco uso', category: 'home', priceRange: [60000, 90000] },
  { title: 'Toyota Corolla 2018', desc: 'Automático, 50.000 km, mantenciones al día', category: 'vehicles', priceRange: [12000000, 15000000] },
  { title: 'Honda CB600F', desc: 'Moto deportiva, revisión técnica vigente', category: 'vehicles', priceRange: [3500000, 4500000] },
  { title: 'Clases de Matemáticas', desc: 'Profesor universitario, online o presencial', category: 'services', priceRange: [15000, 25000] },
  { title: 'Reparación de Computadores', desc: 'Servicio técnico especializado, domicilio', category: 'services', priceRange: [20000, 50000] }
]

// Función para generar posts con filtros - MEJORADA PARA INFINITE SCROLL REAL
const generatePosts = (page: number, limit: number = 9, filters: PostFilters): Post[] => {
  const posts: Post[] = []
  const startId = (page - 1) * limit + 1
  
  for (let i = 0; i < limit; i++) {
    const id = startId + i
    // Usar modulo para reciclar datos pero con IDs únicos
    const productIndex = (id - 1) % productData.length
    const product = productData[productIndex]
    const category = categories.find(cat => cat.id === product.category)!
    
    // Generar precio como número entero sin decimales
    const randomPrice = Math.floor(Math.random() * (product.priceRange[1] - product.priceRange[0]) + product.priceRange[0])
    
    const post: Post = {
      id,
      title: `${product.title} ${Math.floor(id / productData.length) > 0 ? `(${Math.floor(id / productData.length) + 1})` : ''}`,
      description: product.desc,
      categoryId: product.category,
      categoryName: category.name,
      author: `${category.name === 'Servicios' ? 'Proveedor' : 'Usuario'} ${id}`,
      avatar: `https://avatar.iran.liara.run/public/${id}`,
      content: `${product.title} - ${product.desc}`,
      image: `https://picsum.photos/400/300?random=${id}`,
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 15),
      shares: Math.floor(Math.random() * 5),
      timeAgo: `${Math.floor(Math.random() * 48)}h`,
      price: randomPrice.toString()
    }
    
    posts.push(post)
  }
  
  // Aplicar filtros
  return posts.filter(post => {
    // Filtro por categoría
    if (filters.categoryId && post.categoryId !== filters.categoryId) {
      return false
    }
    
    // Filtro por texto (buscar en título y descripción)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesTitle = post.title.toLowerCase().includes(searchLower)
      const matchesDescription = post.description.toLowerCase().includes(searchLower)
      return matchesTitle || matchesDescription
    }
    
    return true
  })
}

// Función para fetch de posts con simulación de API - SIN LÍMITE ARTIFICIAL
const fetchPosts = async ({ 
  pageParam = 1, 
  filters 
}: { 
  pageParam?: number
  filters: PostFilters 
}): Promise<{ posts: Post[], nextPage: number | undefined, hasMore: boolean }> => {
  console.log(`🔍 Fetching page ${pageParam} with filters:`, filters)
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const posts = generatePosts(pageParam, 9, filters)
  
  // SCROLL INFINITO REAL - Sin límite artificial de páginas
  // Solo detener si no hay posts debido a filtros muy restrictivos
  const hasMore = posts.length > 0
  
  return {
    posts,
    nextPage: hasMore ? pageParam + 1 : undefined,
    hasMore
  }
}

// Hook personalizado para el manejo de posts con filtros
export const usePostsWithFilters = (filters: PostFilters) => {
  const queryClient = useQueryClient()
  
  // Crear clave única para la query basada en los filtros
  const queryKey = ['posts', filters.searchTerm, filters.categoryId]
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, filters }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: true, // Siempre habilitado
  })

  // Limpiar cache cuando cambian los filtros significativamente
  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['posts'] })
  }

  // Aplanar todas las páginas en un solo array
  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.posts) ?? []
  }, [data])

  // Información de resultados
  const hasResults = posts.length > 0
  const totalResults = posts.length

  return {
    posts,
    hasResults,
    totalResults,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    clearCache
  }
}

// Hook para debounce
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}