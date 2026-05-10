import { create } from 'zustand'

export const useLocationStore = create((set) => ({
  location: null,
  city: null,
  setLocation: (loc) => set({ location: loc }),
  setCity: (city) => set({ city }),
}))

export default useLocationStore