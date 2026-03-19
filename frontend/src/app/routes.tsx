import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Layout } from "./components/layout";
import { Home } from "./pages/home";
import { Igrejas } from "./pages/igrejas";
import { Membros } from "./pages/membros";
import { Members } from "./pages/members";
import { Ministries } from "./pages/ministries";
import { Calendar } from "./pages/calendar";
import { Leadership } from "./pages/leadership";
import { Invitations } from "./pages/invitations";
import { Studies } from "./pages/studies";
import { Worship } from "./pages/worship";
import { Search } from "./pages/search";
import { Dizimos } from "./pages/dizimos";
import { NotFound } from "./pages/not-found";
import { Login } from "./pages/login";
import { AuthProvider } from "./context/AuthContext";
import { MockDataProvider } from "./context/MockDataContext";

import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export function RootProvider() {
  return (
    <AuthProvider>
      <AuthLoader>
        <Outlet />
      </AuthLoader>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootProvider,
    children: [
      {
        path: "login",
        Component: Login,
      },
      {
        element: (
          <MockDataProvider>
            <Layout />
          </MockDataProvider>
        ),
        children: [
          { index: true, Component: Home },
          { path: "igrejas", Component: Igrejas },
          { path: "membros", Component: Membros },
          { path: "members", element: <Navigate to="/membros" replace /> },
          { path: "ministries", Component: Ministries },
          { path: "calendar", Component: Calendar },
          { path: "leadership", Component: Leadership },
          { path: "invitations", Component: Invitations },
          { path: "studies", Component: Studies },
          { path: "worship", Component: Worship },
          { path: "search", Component: Search },
          { path: "dizimos", Component: Dizimos },
          { path: "*", Component: NotFound },
        ],
      },
    ]
  }
]);
