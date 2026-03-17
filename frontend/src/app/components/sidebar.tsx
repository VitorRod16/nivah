import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Info, 
  Users, 
  Crown, 
  CalendarDays, 
  DollarSign, 
  BookOpen, 
  Music, 
  Mail, 
  Search,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/about", label: "About the Ministry", icon: Info },
  { path: "/members", label: "Members", icon: Users },
  { path: "/leadership", label: "Leadership", icon: Crown },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/tithes", label: "Tithes and Offerings", icon: DollarSign },
  { path: "/studies", label: "Studies", icon: BookOpen },
  { path: "/worship", label: "Worship Songs", icon: Music },
  { path: "/invitations", label: "Invitations", icon: Mail },
  { path: "/search", label: "Search Ministries", icon: Search },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">N</span>
              </div>
              <span className="text-xl font-semibold text-sidebar-foreground">Nivah</span>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-sidebar-accent rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onClose}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              © 2026 Nivah Church
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
