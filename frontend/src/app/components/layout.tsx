import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { Church, Users, Calendar, Crown, Mail, BookOpen, Music, Search, LogOut, Menu, X } from 'lucide-react';
import logoImg from '../../assets/53ef4314c936ceb2d472946a347e2bbb419189ab.png';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';

export function Layout() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { leaders, members } = useMockData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentMember = members.find(m => m.email === user?.email);
  const currentLeader = currentMember ? leaders.find(l => l.memberId === currentMember.id) : null;
  const userRoleLabel = currentLeader?.roles?.length
    ? currentLeader.roles.join(", ")
    : (user?.role || "Membro");
  
  const navigation = [
    { name: 'Início', href: '/', icon: Church },
    { name: 'Membros', href: '/members', icon: Users },
    { name: 'Ministérios', href: '/ministries', icon: Church },
    { name: 'Calendário', href: '/calendar', icon: Calendar },
    { name: 'Liderança', href: '/leadership', icon: Crown },
    { name: 'Convites', href: '/invitations', icon: Mail },
    { name: 'Estudos', href: '/studies', icon: BookOpen },
    { name: 'Louvores', href: '/worship', icon: Music },
    { name: 'Buscar', href: '/search', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="flex items-center gap-3">
                <img src={logoImg} alt="Niva Logo" className="w-10 h-10 object-contain" />
                <span className="text-xl font-semibold text-primary">Nivah</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground">
                  Olá, {user?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userRoleLabel}
                </p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative w-3/4 max-w-sm bg-card h-full shadow-2xl flex flex-col p-6 overflow-y-auto z-10 border-r border-border animate-in slide-in-from-left">
            <button 
              className="absolute top-5 right-4 p-2 text-muted-foreground hover:bg-accent rounded-md transition-colors" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-8">
              <img src={logoImg} alt="Niva Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-semibold text-primary">Nivah</span>
            </div>
            
            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-sm font-medium text-muted-foreground">Logado como</p>
              <p className="text-foreground font-semibold">{user?.name}</p>
            </div>

            <div className="flex flex-col gap-2 flex-grow">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Niva - Sistema de Gestão para Igrejas e Ministérios
          </p>
        </div>
      </footer>
    </div>
  );
}