import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Location store — persisted across sessions so the user doesn't have to
 * re-enter their location every visit.
 *
 * Fields used by NearbySellers + LocationPrompt:
 *   coords     { lng, lat } | null
 *   label      human-readable string e.g. "Indore, MP"
 *   radiusKm   search radius selector (5/10/25/50)
 *   pincode    6-digit string | null  (fallback when GPS not available)
 *
 * Actions:
 *   setFromGPS(coords, label)   — called after navigator.geolocation succeeds
 *   setFromPincode({ pincode, lng, lat, label }) — called after pincode entry
 *   setRadius(km)               — radius selector onChange
 *   clear()                     — "Change location" button
 *
 * Legacy fields kept for any other component that may still use them:
 *   location / city / setLocation / setCity
 */
export const useLocationStore = create(
  persist(
    (set) => ({
      // ── Core fields ──────────────────────────────────────────────────
      coords: null, // { lng, lat }
      label: null, // "Indore, MP"
      radiusKm: 10, // default radius
      pincode: null, // "452001"

      // ── Actions ──────────────────────────────────────────────────────
      setFromGPS: (coords, label) =>
        set({
          coords,
          label: label || null,
          pincode: null,
        }),

      setFromPincode: ({ pincode, lng, lat, label }) =>
        set({
          pincode,
          coords: lng != null && lat != null ? { lng, lat } : null,
          label: label || `Pincode ${pincode}`,
        }),

      setRadius: (radiusKm) => set({ radiusKm }),
      // Inside the create(persist(...)) object, add to actions:

      promptOpen: false,
      setPromptOpen: (val) =>
        set((state) => ({
          promptOpen: typeof val === "function" ? val(state.promptOpen) : val,
        })),

      clear: () =>
        set({
          coords: null,
          label: null,
          pincode: null,
          radiusKm: 10,
        }),

      // ── Legacy fields (backward compat) ──────────────────────────────
      location: null,
      city: null,
      setLocation: (location) => set({ location }),
      setCity: (city) => set({ city }),
    }),
    {
      name: "lokaly-location", // localStorage key
      // Only persist data fields, not action functions
      partialize: (state) => ({
        coords: state.coords,
        label: state.label,
        radiusKm: state.radiusKm,
        pincode: state.pincode,
        location: state.location,
        city: state.city,
      }),
    },
  ),
);

export default useLocationStore;
