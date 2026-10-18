import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClient } from '../../context/ClientContext';
import { api } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Building2, ChevronDown, Check, Plus, ShieldCheck } from 'lucide-react';

export const OrgSwitcher: React.FC = () => {
  const { activeOrg, organizations, setActiveOrg, refreshUser } = useAuth();
  const { refreshClients } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = async (org: any) => {
    setActiveOrg(org);
    setIsOpen(false);
    await refreshClients();
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      const created = await api.createOrganization({ name: newOrgName });
      await refreshUser();
      setActiveOrg(created);
      setIsCreateModalOpen(false);
      setNewOrgName('');
      await refreshClients();
    } catch (err: any) {
      console.error("Failed to create org:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-all text-xs font-semibold"
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="max-w-[120px] truncate">{activeOrg?.name || 'Select Org'}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 backdrop-blur-md">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Organizations
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {organizations.map(org => {
                const isCurrent = org.id === activeOrg?.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="truncate">{org.name}</div>
                      <span className="text-[10px] text-slate-400 capitalize">{org.billing_tier.replace('_', ' ')}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Org Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Agency Organization"
      >
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Vanguard Digital Agency"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>This creates a fresh, fully isolated database tenant with zero cross-tenant data leakage.</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
