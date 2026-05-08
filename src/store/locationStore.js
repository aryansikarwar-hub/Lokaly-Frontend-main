import { create } from 'zustand';
import { persist } from 'zustand/middleware';

 
export const useLocationStore = create(
  persist(
    (set, get) => ({
      // { lng, lat }
      coords: null,
      // human-readable label e.g. "Indore, MP"
      label: '',
      pincode: '',
      // 'gps' | 'pincode' | null
      source: null,
      // Last successful resolution timestamp — used to decide whether to refresh.
      resolvedAt: null,
      // Search radius in km — user can adjust from UI.
      radiusKm: 10,

      setFromGPS: ({ lng, lat }, label = '') =>
        set({
          coords: { lng, lat },
          label,
          source: 'gps',
          resolvedAt: Date.now(),
        }),

      setFromPincode: ({ pincode, lng, lat, label }) =>
        set({
          coords: lng != null && lat != null ? { lng, lat } : null,
          pincode,
          label: label || `Pincode ${pincode}`,
          source: 'pincode',
          resolvedAt: Date.now(),
        }),

      setLabel: (label) => set({ label }),
      setRadius: (radiusKm) => set({ radiusKm }),

      clear: () =>
        set({
          coords: null,
          label: '',
          pincode: '',
          source: null,
          resolvedAt: null,
        }),

      // Convenience: do we have something we can geo-query with?
      hasLocation: () => {
        const { coords } = get();
        return !!(coords && Number.isFinite(coords.lng) && Number.isFinite(coords.lat));
      },
    }),
    {
      name: 'lokaly.location',
      partialize: (state) => ({
        coords: state.coords,
        label: state.label,
        pincode: state.pincode,
        source: state.source,
        resolvedAt: state.resolvedAt,
        radiusKm: state.radiusKm,
      }),
    }
  )
);