import type { Post } from '@/features/ProductDetail/ProductDetail.Types/Post'

function computeBase() {
  const raw = import.meta.env.VITE_API_URL ?? '/api'
  if (raw.endsWith('/api')) return raw
  try {
    const u = new URL(raw, window.location.origin)
    return u.pathname.endsWith('/api') ? raw : `${raw.replace(/\/+$/, '')}/api`
  } catch {
    return raw.endsWith('/api') ? raw : `${raw.replace(/\/+$/, '')}/api`
  }
}
const API_BASE = computeBase()

// Tipo de filtro esperado por el hook (definición implícita)
interface PostFilters {
  search?: string;
  categoryId?: string; // ID numérico convertido a string
}

export class PostHttpRepository {
  private base = API_BASE

  // Crear publicación (Producto)
  async create(payload: {
    nombre: string
    precioActual: number | string
    estadoId: number | string
    descripcion?: string
    categoriaId?: number | string
    cantidad?: number | string
    precioAnterior?: number | string
    images?: File[]
    imageUrls?: string[]
  }) {
    const fd = new FormData()
    fd.set('nombre', String(payload.nombre))
    fd.set('precioActual', String(payload.precioActual))
    fd.set('estadoId', String(payload.estadoId))
    if (payload.descripcion) fd.set('descripcion', payload.descripcion)
    if (payload.categoriaId != null && payload.categoriaId !== '')
      fd.set('categoriaId', String(payload.categoriaId))
    if (payload.cantidad != null && payload.cantidad !== '')
      fd.set('cantidad', String(payload.cantidad))
    if (payload.precioAnterior != null && payload.precioAnterior !== '')
      fd.set('precioAnterior', String(payload.precioAnterior))

    for (const f of payload.images ?? []) fd.append('images', f)
    for (const u of payload.imageUrls ?? []) fd.append('imageUrls', u)

    const res = await fetch(`${this.base}/productos`, { 
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: fd,
    })
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detalles: "Error desconocido" }));
        throw new Error(errorData.detalles || 'Error al crear el producto.');
    }
    return res.json()
  }

  // ===================================
  // 2. LISTADO CON FILTROS (HOME)
  // ===================================
  async list(page = 1, limit = 9, filters?: PostFilters) {
    
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    if (filters?.categoryId) {
        params.append('categoryId', filters.categoryId); 
    }
    if (filters?.search) {
        params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = `${this.base}/productos?${queryString}`; 

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detalles: "Error listando productos" }));
        throw new Error(errorData.detalles || 'Error listando productos');
    }
    
    const data = await res.json();
    
    // **CORRECCIÓN CLAVE: Mapeo explícito de propiedades**
    const normalizedItems = data.items.map((item: any) => ({
        // Mapeo de Producto (Backend) a Post/ItemCard (Frontend)
        
        // Propiedades básicas (Asignación directa)
        id: String(item.id),
        title: item.nombre, 
        description: item.descripcion,
        price: item.precioActual, // Viene como Decimal/String, ItemCard lo formatea
        rating: Number(item.calificacion) || 0,
        stock: item.cantidad ? Number(item.cantidad) : 0, // Stock -> stock
        
        // Relaciones anidadas (acceso seguro)
        categoryName: item.categoria?.nombre, 
        author: item.vendedor?.usuario,      
        
        // Imagen (Acceso al array de imágenes)
        image: item.imagenes && item.imagenes.length > 0
               ? item.imagenes[0].urlImagen
               : undefined, 
    }));
    
    // El hook espera { items: [...], totalCount: X, hasMore: boolean }
    return { 
        items: normalizedItems, 
        totalCount: data.total,
        hasMore: (page * limit) < data.total 
    };
  }

  // ===================================
  // 3. OBTENER CATEGORÍAS
  // ===================================
  async getCategories(): Promise<Array<{ id: number; nombre: string }>> {
      try {
        const r = await fetch(`${this.base}/productos/categorias`, { 
          headers: { Accept: 'application/json' } 
        })
        
        if (!r.ok) return []
        
        const data = await r.json();
        return data.categorias || [] 
      } catch {
        return []
      }
    }
}
