"use client"

import React, { createContext, useContext } from "react"
import { useLocalList } from "./use-local-list"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  slug?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)
function validItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as CartItem
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    Number.isFinite(item.price) &&
    item.price > 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 10
  )
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useLocalList("nova-cart", validItem)

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === newItem.id)
      if (existingItem) {
        return prev.map((item) =>
          item.id === newItem.id
            ? {
                ...item,
                quantity: Math.min(10, item.quantity + newItem.quantity),
              }
            : item
        )
      }
      return [...prev, newItem]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => setItems([])

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const total = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
