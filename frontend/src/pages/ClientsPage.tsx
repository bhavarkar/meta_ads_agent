import React, { useState } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import { Client } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ClientSettingsModal } from '../components/clients/ClientSettingsModal';
import {
  Building2,
  PlusCircle,
  ExternalLink,
  Target,
  DollarSign,
  TrendingUp,
  Instagram,
  CheckCircle2,
  Settings
} from 'lucide-react';

export const ClientsPage: React.FC<{ isOpenAddModal: boolean; onCloseAddModal: () => void; onOpenAddModal?: () => void }> = ({
  isOpenAddModal,
  onCloseAddModal,
  onOpenAddModal
}) => {
  const { clients, activeClient, setActiveClient, refreshClients } = useClient();
  const [clientForSettings, setClientForSettings] = useState<Client | null>(null);


  // Form State
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('E-Commerce & DTC');
  const [adAccountId, setAdAccountId] = useState('act_');
  const [igHandle, setIgHandle] = useState('@');
  const [monthlyBudget, setMonthlyBudget] = useState(20000);
  const [targetRoas, setTargetRoas] = useState(3.5);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newClient = await api.createClient({
        name,
        industry,
        meta_ad_account_id: adAccountId,
        instagram_handle: igHandle,
        monthly_budget_usd: Number(monthlyBudget),
        target_roas_goal: Number(targetRoas),
        is_active: true
      });
      await refreshClients();
      setActiveClient(newClient);
      onCloseAddModal();
      setName('');
    } catch (err) {
      console.error("Error creating client:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Multi-Client Agency Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain isolated Meta Ad Accounts, target ROAS constraints, and security per client brand.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={onOpenAddModal}
        >
          Add Client Account
        </Button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.map(client => {
          const isActive = activeClient?.id === client.id;
          return (
            <Card
              key={client.id}
              className={`p-5 flex flex-col justify-between transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg ring-1 ring-indigo-500/30'
                  : 'hover:border-slate-700'
              }`}
              onClick={() => setActiveClient(client)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{client.name}</h3>
                    <span className="text-xs text-slate-400">{client.industry}</span>
                  </div>
                  {isActive ? (
                    <Badge variant="purple" size="sm">Active Session</Badge>
                  ) : (
                    <Badge variant="default" size="sm">Select</Badge>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400">Meta Ad Account:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {client.meta_ad_account_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400">Instagram Handle:</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5 text-indigo-400" />
                      {client.instagram_handle || 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Monthly Budget</span>
                    <span className="font-bold text-slate-100 font-mono">
                      ${client.monthly_budget_usd.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Target ROAS</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {client.target_roas_goal}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {client.active_campaigns_count} active campaigns
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientForSettings(client);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Client Workspace & Meta Token Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <span className="text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    {isActive ? "Active Session" : "Switch →"}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>


      {/* Add Client Modal */}
      <Modal
        isOpen={isOpenAddModal}
        onClose={onCloseAddModal}
        title="Onboard Managed Client"
        description="Configure new brand profile with isolated ad credentials"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={onCloseAddModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitting}
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={handleCreateClient}
            >
              Register Client
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Company / Brand Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Helix Coffee Roasters"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Industry Sector</label>
            <input
              type="text"
              required
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. DTC Food & Beverage"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Meta Ad Account ID</label>
              <input
                type="text"
                required
                value={adAccountId}
                onChange={e => setAdAccountId(e.target.value)}
                placeholder="act_123456789"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Instagram Handle</label>
              <input
                type="text"
                value={igHandle}
                onChange={e => setIgHandle(e.target.value)}
                placeholder="@helixcoffee"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Monthly Budget ($ USD)</label>
              <input
                type="number"
                min={100}
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Target ROAS Goal (e.g. 3.5)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                value={targetRoas}
                onChange={e => setTargetRoas(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Client Settings & Meta Connection Modal */}
      <ClientSettingsModal
        client={clientForSettings}
        isOpen={Boolean(clientForSettings)}
        onClose={() => setClientForSettings(null)}
        onClientUpdated={async (updatedClient) => {
          await refreshClients();
          if (activeClient?.id === updatedClient.id) {
            setActiveClient(updatedClient);
          }
        }}
      />
    </div>
  );
};

