"use client";

import { createContext, useState, useEffect } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import { NotificationProvider } from "@/app/context/NotificationContext";

export const CartContext = createContext<any>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const savedCart = localStorage.getItem("cart");
    try {
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product, quantity, size) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id && item.size === size);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images ? product.images[0] : (product.image || ""),
          quantity,
          size,
        },
      ];
    });
  };

  const removeFromCart = (id, size) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id, size, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id && item.size === size ? { ...item, quantity: newQuantity } : item))
    );
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <AuthProvider>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal }}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </CartContext.Provider>
    </AuthProvider>
  );
}
