import { create } from "zustand";
import type { UserProfile } from "../types/user";

interface UserState {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoggedIn: !!localStorage.getItem("token"),
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token, isLoggedIn: !!token });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
