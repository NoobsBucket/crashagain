import { useState, useEffect } from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
};

const CART_KEY = "crashcart_cart";

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        updated = [...prev, { ...product, quantity: 1 }];
      }
      saveCart(updated);
      return updated;
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      saveCart(updated);
      return updated;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return removeFromCart(id);
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity } : i);
      saveCart(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    saveCart([]);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice };
}