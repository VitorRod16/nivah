import { useAuth, type UserRole } from "../context/AuthContext";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  PASTOR: "Pastor",
  MEMBRO: "Membro",
};

export function useRole() {
  const { user } = useAuth();
  const role: UserRole = user?.role ?? "MEMBRO";
  return {
    role,
    isAdmin: role === "ADMIN",
    isPastor: role === "PASTOR",
    isMembro: role === "MEMBRO",
    label: roleLabels[role],
    canManage: role === "ADMIN" || role === "PASTOR",
  };
}
