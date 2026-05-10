import { create } from 'zustand'

const useLocationStore = create((set) => ({
  location: null,
  setLocation: (loc) => set({ location: loc }),
}))

export default useLocationStore
