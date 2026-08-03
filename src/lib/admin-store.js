import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAdminStore = create()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setSession: (token, admin) => set({ token, admin }),
      logout: () => set({ token: null, admin: null }),
    }),
    { name: "togglenow-admin" },
  ),
);
