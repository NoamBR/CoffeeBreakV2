import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import { CartItem, MenuItem, ItemCustomization } from '@/types';
import { sizeOptions, foodExtras } from '@/data/customizations';

type CartState = {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, customization?: ItemCustomization) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
};

function calcTotalPrice(basePrice: number, quantity: number, customization?: ItemCustomization): number {
  let unitPrice = basePrice;
  if (customization?.size) {
    const sizeOpt = sizeOptions.find((s) => s.value === customization.size);
    if (sizeOpt) unitPrice += sizeOpt.priceAdd;
  }
  if (customization?.extras?.length) {
    for (const extraId of customization.extras) {
      const extra = foodExtras.find((e) => e.id === extraId);
      if (extra) unitPrice += extra.price;
    }
  }
  return unitPrice * quantity;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem, quantity, customization) => {
        const cartItem: CartItem = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          menuItemId: menuItem.id,
          name: menuItem.name,
          image: menuItem.image,
          price: menuItem.price,
          quantity,
          customization,
          totalPrice: calcTotalPrice(menuItem.price, quantity, customization),
        };
        set((state) => ({ items: [...state.items, cartItem] }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity, totalPrice: calcTotalPrice(item.price, quantity, item.customization) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
    }),
    {
      name: 'coffeebreak-cart',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
