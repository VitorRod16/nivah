import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type UserRole = "ADMIN" | "PASTOR" | "MEMBRO";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string; token?: string; userData?: User }>;
  finalizeAuth: (user: User, token: string) => void;
  updateUser: (data: { name: string; email: string }) => Promise<{ success: boolean; error?: string }>;
  updatePhoto: (photoUrl: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoadingAuth: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = "http://localhost:8080/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ id: data.id, name: data.name, email: data.email, role: data.role ?? "MEMBRO", photoUrl: data.photoUrl });
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Failed to fetch session", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      if (!password) return { success: false, error: "Senha não fornecida." };
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: "E-mail ou senha incorretos." };
      localStorage.setItem("token", data.token);
      setUser({ id: data.id, name: data.name, email: data.email, role: data.role ?? "MEMBRO", photoUrl: data.photoUrl });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const register = async (name: string, email: string, password?: string, role: UserRole = "MEMBRO") => {
    try {
      if (!password) return { success: false, error: "Senha não fornecida." };
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data.message || "Erro ao registrar usuário.";
        if (errorMsg.includes("already")) errorMsg = "Este e-mail já está em uso.";
        return { success: false, error: errorMsg };
      }
      const userData: User = { id: data.id, name: data.name, email: data.email, role: data.role ?? "MEMBRO" };
      return { success: true, token: data.token, userData };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const finalizeAuth = (user: User, token: string) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const updateUser = async (data: { name: string; email: string }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) return { success: false, error: "Erro ao atualizar perfil." };
      const updated = await res.json();
      setUser(prev => prev ? { ...prev, ...updated } : prev);
      return { success: true };
    } catch {
      setUser(prev => prev ? { ...prev, ...data } : prev);
      return { success: true };
    }
  };

  const updatePhoto = async (photoUrl: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/auth/me/photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ photoUrl }),
      });
      if (!res.ok) return { success: false, error: "Erro ao atualizar foto." };
      setUser(prev => prev ? { ...prev, photoUrl } : prev);
      return { success: true };
    } catch {
      return { success: false, error: "Erro ao atualizar foto." };
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, finalizeAuth, updateUser, updatePhoto, logout, isLoadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
