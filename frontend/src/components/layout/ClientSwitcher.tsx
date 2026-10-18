import React, { useState, useRef, useEffect } from 'react';
import { useClient } from '../../context/ClientContext';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';

export const ClientSwitcher: React.FC<{ onOpenAddClient?: () => void }> = ({ onOpenAddClient }) => {
  const { clients, activeClient, setActiveClient } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeClient) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs transition-all text-left group"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
          {activeClient.name.substring(0, 1)}
        </div>
        <div className="flex flex-col pr-1">
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
            {activeClient.name}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {activeClient.meta_ad_account_id}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Switch Client Account
          </div>
          <div className="space-y-1">
            {clients.map(client => {
              const isSelected = client.id === activeClient.id;
              return (
                <button
                  key={client.id}
                  onClick={() => {
                    setActiveClient(client);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="flex flex-col text-left truncate">
                      <span className="truncate">{client.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{client.industry}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {onOpenAddClient && (
            <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddClient();
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard New Client</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
