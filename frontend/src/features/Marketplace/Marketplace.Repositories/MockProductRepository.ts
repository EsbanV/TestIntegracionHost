// Marketplace/Marketplace.Repositories/MockProductRepository.ts

import type { Product, ProductFilters, ProductRepository } from '@/features/Marketplace/Marketplace.Types/product';

// Datos de categorías
const categories = [
  { id: 'electronics', name: 'Electrónicos' },
  { id: 'books', name: 'Libros y Materiales' },
  { id: 'clothing', name: 'Ropa y Accesorios' },
  { id: 'sports', name: 'Deportes' },
  { id: 'home', name: 'Hogar y Jardín' },
  { id: 'vehicles', name: 'Vehículos' },
  { id: 'services', name: 'Servicios' }
];

// Datos de productos (migrado de tu hook original)
const productData = [
  { title: 'iPhone 14 Pro Max', desc: 'Excelente estado, incluye cargador y caja original', category: 'electronics', priceRange: [800000, 1200000] },
  // ... (Resto de tu productData)
  { title: 'Clases de Matemáticas', desc: 'Profesor universitario, online o presencial', category: 'services', priceRange: [15000, 25000] },
  { title: 'Reparación de Computadores', desc: 'Servicio técnico especializado, domicilio', category: 'services', priceRange: [20000, 50000] }
];

export class MockProductRepository implements ProductRepository {
  async findAll(filters: ProductFilters, page: number = 1, limit: number = 9): Promise<{
    products: Product[];
    hasMore: boolean;
    totalCount: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const products = this.generateProducts(page, limit, filters);
    const hasMore = products.length > 0;
    
    return {
      products,
      hasMore,
      totalCount: 1000
    };
  }

  async findById(id: number): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const productIndex = (id - 1) % productData.length;
    const product = productData[productIndex];
    const category = categories.find(cat => cat.id === product.category)!;
    
    return {
      id,
      title: `${product.title} ${Math.floor(id / productData.length) > 0 ? `(${Math.floor(id / productData.length) + 1})` : ''}`,
      description: product.desc,
      content: `${product.title} - ${product.desc}`,
      categoryId: product.category,
      categoryName: category.name,
      author: `${category.name === 'Servicios' ? 'Proveedor' : 'Usuario'} ${id}`,
      avatar: `https://avatar.iran.liara.run/public/${id}`,
      image: `https://picsum.photos/400/300?random=${id}`,
      price: `$${(Math.random() * (product.priceRange[1] - product.priceRange[0]) + product.priceRange[0]).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      sellerRating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Rating 3.0 a 5.0
      sales: Math.floor(Math.random() * 50) + 1, // Ventas 1 a 50
    };
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sellerRating' | 'sales'>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...product, id: Date.now(), createdAt: new Date(), updatedAt: new Date(), sellerRating: 5.0, sales: 0 };
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const existingProduct = await this.findById(id);
    if (!existingProduct) throw new Error('Product not found');
    return { ...existingProduct, ...productData, updatedAt: new Date() };
  }

  async delete(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Product ${id} deleted`);
  }

  private generateProducts(page: number, limit: number, filters: ProductFilters): Product[] {
    const products: Product[] = [];
    const startId = (page - 1) * limit + 1;
    
    for (let i = 0; i < limit; i++) {
      const id = startId + i;
      const productIndex = (id - 1) % productData.length;
      const productDataEntry = productData[productIndex];
      const category = categories.find(cat => cat.id === productDataEntry.category)!;
      
      const priceValue = Math.random() * (productDataEntry.priceRange[1] - productDataEntry.priceRange[0]) + productDataEntry.priceRange[0];
      
      const newProduct: Product = {
        id,
        title: `${productDataEntry.title} ${Math.floor(id / productData.length) > 0 ? `(${Math.floor(id / productData.length) + 1})` : ''}`,
        description: productDataEntry.desc,
        content: `${productDataEntry.title} - ${productDataEntry.desc}`,
        categoryId: productDataEntry.category,
        categoryName: category.name,
        author: `${category.name === 'Servicios' ? 'Proveedor' : 'Usuario'} ${id}`,
        avatar: `https://avatar.iran.liara.run/public/${id}`,
        image: `https://picsum.photos/400/300?random=${id}`,
        price: `$${priceValue.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerRating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Simular Rating
        sales: Math.floor(Math.random() * 50) + 1, // Simular Ventas
      };
      
      products.push(newProduct);
    }
    
    return products.filter(product => {
      if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
      
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(searchLower);
        const matchesDescription = product.description.toLowerCase().includes(searchLower);
        return matchesTitle || matchesDescription;
      }
      return true;
    });
  }
}