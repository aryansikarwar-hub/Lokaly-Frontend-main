import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({

      // =========================
      // STATE
      // =========================

      token: null,

      user: null,

      // =========================
      // SET AUTH
      // =========================

      setAuth: (user, token) => {

        console.log("[auth] saving token");

        set({
          user,
          token,
        });
      },

      // =========================
      // HYDRATE
      // =========================

      hydrate: (token, user) => {

        console.log("[auth] hydrate");

        set({
          token,
          user,
        });
      },

      // =========================
      // LOGOUT
      // =========================

      logout: () => {

        console.log("[auth] logout");

        set({
          token: null,
          user: null,
        });
      },

      // =========================
      // CHECK
      // =========================

      isAuthed: () => !!get().token,

    }),

    {
      name: "lokaly-auth",
    }
  )
);

export default useAuthStore;