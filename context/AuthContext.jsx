"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchFresh } from "@/lib/fetchFresh";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [client, setClient] = useState(undefined); // undefined = loading, null = logged out
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const refresh = () => {
    fetchFresh("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setClient(data.client))
      .catch(() => setClient(null));
  };

  useEffect(() => {
    refresh();
  }, []);

  async function login({ phone, password }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось войти.");
    setClient(data.client);
    return data.client;
  }

  async function register({ name, phone, password }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось зарегистрироваться.");
    setClient(data.client);
    return data.client;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setClient(null);
  }

  const value = { client, login, register, logout, refresh, authModalOpen, setAuthModalOpen };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
