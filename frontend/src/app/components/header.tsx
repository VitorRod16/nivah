import { Search, Bell, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-secondary rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-input-background rounded-lg border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* User avatar */}
          <button className="flex items-center gap-2 hover:bg-secondary rounded-lg p-1 pr-3 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
            <span className="hidden sm:block text-sm font-medium">John Doe</span>
          </button>
        </div>
      </div>
    </header>
  );
}
