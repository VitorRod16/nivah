import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { Church, Users, Calendar, Crown, Mail, BookOpen, Music, Search, LogOut, Menu, X, Sun, Moon, UserCircle, DollarSign } from 'lucide-react';
import logoImg from '../../assets/53ef4314c936ceb2d472946a347e2bbb419189ab.png';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { useTheme } from '../context/ThemeContext';
import { ProfileModal } from './ProfileModal';

export function Layout() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { label: userRoleLabel, isAdmin, canManage } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const navigation = [
    { name: 'Início', href: '/', icon: Church, show: true },
    { name: 'Igrejas', href: '/igrejas', icon: Church, show: isAdmin },
    { name: 'Membros', href: '/membros', icon: Users, show: true },
    { name: 'Ministérios', href: '/ministries', icon: Church, show: canManage },
    { name: 'Calendário', href: '/calendar', icon: Calendar, show: true },
    { name: 'Liderança', href: '/leadership', icon: Crown, show: canManage },
    { name: 'Convites', href: '/invitations', icon: Mail, show: canManage },
    { name: 'Dízimos e Ofertas', href: '/dizimos', icon: DollarSign, show: true },
    { name: 'Estudos', href: '/studies', icon: BookOpen, show: true },
    { name: 'Louvores', href: '/worship', icon: Music, show: true },
    { name: 'Buscar', href: '/search', icon: Search, show: true },
  ].filter(item => item.show);

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
            
            <div className="flex items-center gap-3">
              {/* Profile dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
                  aria-label="Menu do perfil"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold select-none">
                    {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {userRoleLabel}
                    </p>
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-md border border-border bg-popover shadow-lg z-50 py-1">
                    <button
                      onClick={() => { setIsProfileMenuOpen(false); setIsProfileModalOpen(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                      Ver perfil
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
            
            <div className="mb-6 pb-6 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Logado como</p>
                <p className="text-foreground font-semibold">{user?.name}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-grow">
              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsProfileModalOpen(true); }}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <UserCircle className="w-5 h-5" />
                Ver perfil
              </button>
              <div className="my-1 h-px bg-border" />
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
              <div className="mt-auto pt-4 border-t border-border">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        roleLabel={userRoleLabel}
      />

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