import { create } from 'zustand';
import api from '../services/api';

export const useCartStore = create((set, get) => ({
  cart: null,
  subtotal: 0,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.cart, subtotal: data.subtotal, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  add: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/add', { productId, quantity });
    set({ cart: data.cart, subtotal: data.subtotal });
  },

  update: async (productId, quantity) => {
    const { data } = await api.patch('/cart/update', { productId, quantity });
    set({ cart: data.cart, subtotal: data.subtotal });
  },

  remove: async (productId) => {
    const { data } = await api.delete(`/cart/item/${productId}`);
    set({ cart: data.cart, subtotal: data.subtotal });
  },

  clear: async () => {
    await api.delete('/cart/clear');
    set({ cart: null, subtotal: 0 });
  },

  count: () => (get().cart?.items || []).reduce((s, i) => s + i.quantity, 0),
}));

export default useCartStore;
