import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrate: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthed: () => !!get().token,
    }),
    { name: 'lokaly-auth' }
  )
);

export default useAuthStore;
