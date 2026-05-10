import { create } from 'zustand'

const useLocationStore = create((set) => ({
  location: null,
  setLocation: (loc) => set({ location: loc }),
}))

// Dono exports — taaki named aur default dono import kaam karein
export { useLocationStore }
export default useLocationStore