import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const ModeBadge: React.FC = () => {
  const { isDemoMode, setDemoMode } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {isDemoMode ? (
        <div
          title="Demo Mode: All displayed advertising metrics and campaign analytics are synthetic demo data."
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold tracking-wide shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5" />
          <span>DEMO MODE: Synthetic Data Active</span>
        </div>
      ) : (
        <div
          title="Connected Mode: Live connection to official Meta Graph API & Instagram Graph API."
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold tracking-wide shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CONNECTED: Official Meta API Active</span>
        </div>
      )}

      <button
        onClick={() => setDemoMode(!isDemoMode)}
        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline underline-offset-2 ml-1"
      >
        {isDemoMode ? 'Simulate Live' : 'Switch Demo'}
      </button>
    </div>
  );
};
