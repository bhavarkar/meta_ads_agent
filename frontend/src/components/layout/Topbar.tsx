import React from 'react';
import { OrgSwitcher } from './OrgSwitcher';
import { ClientSwitcher } from './ClientSwitcher';
import { ModeBadge } from './ModeBadge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Shield, LogOut } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface TopbarProps {
  onOpenAddClient: () => void;
  onNavigate?: (tab: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenAddClient, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, activeOrg, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Org Switcher, Client Switcher & Safety Badge */}
      <div className="flex items-center gap-3">
        <OrgSwitcher />
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
        <ClientSwitcher onOpenAddClient={onOpenAddClient} />
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
        <ModeBadge />
      </div>

      {/* Right: Actions, Theme, User & Logout */}
      <div className="flex items-center gap-3">
        {/* Tenant Scope Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>Tenant: {activeOrg?.slug || user?.tenant_id || 'isolated'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Center */}
        <NotificationCenter onNavigate={onNavigate} />

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/20">
            {(user?.email || 'U').substring(0, 1).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">{user?.role ? user.role.replace('_', ' ') : 'Member'}</span>
          </div>


          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

