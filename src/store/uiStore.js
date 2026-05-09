import { create } from "zustand";

export const useUIStore = create((set) => ({
  locationPromptOpen: false,
  setLocationPromptOpen: (v) => set({ locationPromptOpen: v }),
}));
