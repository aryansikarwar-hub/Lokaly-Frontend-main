import { create } from "zustand";

export const useAIShopperStore = create((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));
