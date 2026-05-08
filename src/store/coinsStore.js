import { create } from "zustand";
import api from "../services/api";

export const useCoinsStore = create((set, get) => ({
  balance: 0,
  ledger: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/coins/ledger");
      set({
        balance: data.balance ?? 0,
        ledger: data.items ?? [],
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  // Optimistic local update — call after an action you know awarded coins
  // (e.g. after a successful order). Real value will sync on next fetch().
  addLocal: (delta) => set({ balance: Math.max(0, get().balance + delta) }),

  reset: () => set({ balance: 0, ledger: [], loading: false }),
}));

export default useCoinsStore;
