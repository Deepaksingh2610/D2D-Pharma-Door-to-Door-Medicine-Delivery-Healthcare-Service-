import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from local storage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Add Item (handles both medicines and labs)
  const addToCart = (item) => {
    setCart((prevCart) => {
      // Check if item already exists
      const existingItem = prevCart.find((i) => i.id === item.id && i.type === item.type);
      if (existingItem) {
        // If it's a medicine, increase quantity
        if (item.type === 'medicine') {
          return prevCart.map((i) =>
            i.id === item.id && i.type === item.type ? { ...i, quantity: (i.quantity || 1) + 1 } : i
          );
        }
        // If it's a lab test, do not duplicate (usually booked once per person per slot)
        return prevCart;
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id, type) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id, type, amount) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id && item.type === type) {
        const newQuantity = Math.max(1, (item.quantity || 1) + amount);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
