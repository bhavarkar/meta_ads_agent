import React from 'react';
import {
  LayoutDashboard,
  Search,
  Sparkles,
  Layers,
  Video,
  BarChart3,
  Lightbulb,
  Building2,
  ShieldCheck,
  Settings,
  ChevronRight,
  Users,
  Cpu
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'competitors'
  | 'strategy'
  | 'campaigns'
  | 'reels'
  | 'analytics'
  | 'recommendations'
  | 'automations'
  | 'clients'
  | 'team'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'competitors' as NavItem, label: 'Competitor Intel', icon: Search, badge: 'Live Spy' },
        { id: 'strategy' as NavItem, label: 'Strategy Generator', icon: Sparkles, badge: 'AI' },
      ]
    },
    {
      title: 'EXECUTION & ADS',
      items: [
        { id: 'campaigns' as NavItem, label: 'Campaign Drafts', icon: Layers, badge: 'Guarded' },
        { id: 'reels' as NavItem, label: 'Reels Studio', icon: Video, badge: '9:16' },
      ]
    },
    {
      title: 'INTELLIGENCE & SCALE',
      items: [
        { id: 'analytics' as NavItem, label: 'Performance Analytics', icon: BarChart3 },
        { id: 'recommendations' as NavItem, label: 'AI Recommendations', icon: Lightbulb, badge: 'Top 5' },
        { id: 'automations' as NavItem, label: 'Automations & Reports', icon: Cpu, badge: 'Jobs' },
      ]
    },
    {
      title: 'ADMIN & COMPLIANCE',
      items: [
        { id: 'clients' as NavItem, label: 'Client Accounts', icon: Building2 },
        { id: 'team' as NavItem, label: 'Team & Access', icon: Users, badge: 'RBAC' },
        { id: 'audit-logs' as NavItem, label: 'Audit & Safety', icon: ShieldCheck },
        { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
      ]
    }
  ];


  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">MetaPilot</span>
            <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Meta Ads & Reels Automation</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Meta Guard Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PAUSED Safety Guard</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v19.0 API</span>
        </div>
      </div>
    </aside>
  );
};
