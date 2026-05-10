import { create } from 'zustand'

export const useLocationStore = create((set) => ({
  location: null,
  city: null,
  setLocation: (loc) => set({ location: loc }),
  setCity: (city) => set({ city }),
}))

// Dono exports — taaki named aur default dono import kaam karein
export { useLocationStore }
export default useLocationStore