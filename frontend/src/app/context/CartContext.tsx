import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definimos la estructura de un ítem en el carrito
export interface CartItem {
  id: number;
  nombre: string;
  precioActual: number;
  imagenUrl?: string;
  cantidad: number;
  vendedorNombre?: string;
  stockMaximo: number; // Para no dejar agregar más del stock real
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  updateQuantity: (productId: number, amount: number) => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Inicializar carrito desde localStorage si existe
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('shopping_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Guardar en localStorage cada vez que el carrito cambie
  useEffect(() => {
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
  }, [cart]);

  // Calcular totales
  const total = cart.reduce((sum, item) => sum + (item.precioActual * item.cantidad), 0);
  const count = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // Agregar producto
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        // Si ya existe, aumentamos cantidad (respetando stock)
        if (existing.cantidad >= (product.cantidad || 1)) return prev; // Límite de stock alcanzado
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }

      // Si es nuevo, lo agregamos
      return [...prev, {
        id: product.id,
        nombre: product.nombre,
        precioActual: Number(product.precioActual),
        imagenUrl: product.imagenes?.[0]?.url || product.imagenUrl, // Adaptador para tus tipos
        cantidad: 1,
        vendedorNombre: product.vendedor?.nombre,
        stockMaximo: product.cantidad || 1
      }];
    });
    setIsCartOpen(true); // Abrir carrito automáticamente al agregar (opcional)
  };

  // Eliminar producto
  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Actualizar cantidad (+1 o -1)
  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        // Validar límites (mínimo 1, máximo stock)
        if (newQty < 1) return item; 
        if (newQty > item.stockMaximo) return item;
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, clearCart, updateQuantity, 
      total, count, isCartOpen, toggleCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};