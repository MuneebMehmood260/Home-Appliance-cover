import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CART_STORAGE_KEY = 'hac_cart_items_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    if (product.stock_quantity <= 0) {
      toast.error('Sorry, this product is currently out of stock.');
      return;
    }

    const selectedSize = size || (product.sizes?.length ? product.sizes[0] : undefined);
    const selectedColor = color || (product.colors?.length ? product.colors[0] : undefined);
    const cartItemId = `${product.id}-${selectedSize || 'default'}-${selectedColor || 'default'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        const targetQty = existing.quantity + quantity;
        if (targetQty > product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} available in stock.`);
          return prev;
        }
        toast.success(`Updated "${product.name}" quantity (${targetQty})`);
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: targetQty } : item
        );
      }

      toast.success(`Added "${product.name}" to cart!`);
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity: Math.min(quantity, product.stock_quantity),
          selected_size: selectedSize,
          selected_color: selectedColor,
        },
      ];
    });
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const validQty = Math.min(newQty, item.product.stock_quantity);
          if (newQty > item.product.stock_quantity) {
            toast.error(`Maximum available stock is ${item.product.stock_quantity}`);
          }
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cart.reduce((acc, item) => {
    const activePrice = item.product.discount_price ?? item.product.price;
    return acc + activePrice * item.quantity;
  }, 0);

  const totalSavings = cart.reduce((acc, item) => {
    if (item.product.discount_price && item.product.discount_price < item.product.price) {
      const diff = item.product.price - item.product.discount_price;
      return acc + diff * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        subtotal,
        totalSavings,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
