import type { Publication } from '../../../ProductDetail/ProductDetail.Types/publication';

export const mockPublications: Record<string, Publication> = {
  'p-1001': {
    id: 'p-1001',
    title: 'Auriculares Inalámbricos Pro',
    description: 'Cancelación de ruido, 30h de batería, Bluetooth 5.3',
    price: 59990,
    images: ['/assets/mock/earbuds.jpg'],
    attributes: { Color: 'Negro', Garantía: '12 meses', Peso: '180g' },
    seller: { id: 'u-10', name: 'TechStore', avatarUrl: '/assets/mock/seller-techstore.png' },
    stock: 8,
    location: 'Santiago, CL',
    createdAt: new Date().toISOString(),
  },
  'p-1002': {
    id: 'p-1002',
    title: 'Teclado Mecánico RGB',
    description: 'Switches rojos, layout ANSI, retroiluminación per-key',
    price: 42990,
    images: ['/assets/mock/keyboard.jpg'],
    attributes: { Switch: 'Rojo', Formato: 'TKL', Cable: 'USB-C' },
    seller: { id: 'u-11', name: 'KeyLab', avatarUrl: '/assets/mock/seller-keylab.png' },
    stock: 0,
    location: 'Valparaíso, CL',
    createdAt: new Date().toISOString(),
  },
};