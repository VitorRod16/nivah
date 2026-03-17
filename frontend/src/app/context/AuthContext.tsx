import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
          setUser(data);
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
      setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    try {
      if (!password) return { success: false, error: "Senha não fornecida." };
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "Membro" }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data.message || "Erro ao registrar usuário.";
        if (errorMsg.includes("already")) errorMsg = "Este e-mail já está em uso.";
        else if (errorMsg.includes("password")) errorMsg = "A senha deve ter no mínimo 6 caracteres.";
        return { success: false, error: errorMsg };
      }
      localStorage.setItem("token", data.token);
      setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
