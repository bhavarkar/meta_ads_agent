import React, { useState, useEffect } from 'react';
import { Client, MetaConnection } from '../../types';
import { api } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  KeyRound,
  ShieldCheck,
  Building2,
  DollarSign,
  Target,
  Instagram,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-react';

interface ClientSettingsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: (updatedClient: Client) => void;
}

export const ClientSettingsModal: React.FC<ClientSettingsModalProps> = ({
  client,
  isOpen,
  onClose,
  onClientUpdated
}) => {
  if (!client) return null;

  // General settings state
  const [name, setName] = useState(client.name);
  const [industry, setIndustry] = useState(client.industry);
  const [monthlyBudget, setMonthlyBudget] = useState(client.monthly_budget_usd);
  const [targetRoas, setTargetRoas] = useState(client.target_roas_goal);
  const [instagramHandle, setInstagramHandle] = useState(client.instagram_handle || '');

  // Meta Connection state
  const [adAccountId, setAdAccountId] = useState(client.meta_ad_account_id || '');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [metaConnection, setMetaConnection] = useState<MetaConnection | null>(null);

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (client && isOpen) {
      setName(client.name);
      setIndustry(client.industry);
      setMonthlyBudget(client.monthly_budget_usd);
      setTargetRoas(client.target_roas_goal);
      setInstagramHandle(client.instagram_handle || '');
      setAdAccountId(client.meta_ad_account_id || '');
      setMetaAccessToken('');
      setNotification(null);

      // Fetch existing meta connection if any
      api.getMetaConnection(client.id)
        .then(conn => {
          setMetaConnection(conn);
          if (conn.instagram_account_id) setInstagramAccountId(conn.instagram_account_id);
        })
        .catch(() => setMetaConnection(null));
    }
  }, [client, isOpen]);

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setNotification(null);
    try {
      const updated = await api.updateClient(client.id, {
        name,
        industry,
        monthly_budget_usd: Number(monthlyBudget),
        target_roas_goal: Number(targetRoas),
        instagram_handle: instagramHandle
      });
      onClientUpdated(updated);
      setNotification({
        type: 'success',
        message: 'Client profile and budget parameters successfully updated.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to update client settings.'
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveMetaConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaAccessToken.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide a valid Meta Access Token.'
      });
      return;
    }
    setSavingMeta(true);
    setNotification(null);
    try {
      const savedConn = await api.saveMetaConnection(client.id, {
        ad_account_id: adAccountId,
        access_token: metaAccessToken,
        instagram_account_id: instagramAccountId || undefined
      });
      setMetaConnection(savedConn);
      setMetaAccessToken('');
      setNotification({
        type: 'success',
        message: 'Meta credentials securely vaulted and encrypted on server.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to save Meta connection.'
      });
    } finally {
      setSavingMeta(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Client Workspace: ${client.name}`}
    >
      <div className="space-y-6">
        {notification && (
          <div className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Section 1: General Client Parameters */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Workspace Profile & Guardrails</span>
          </h4>

          <form onSubmit={handleUpdateGeneral} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Industry</label>
                <input
                  type="text"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  min={100}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target ROAS (x)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={targetRoas}
                  onChange={(e) => setTargetRoas(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@brandname"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={savingGeneral}
              >
                {savingGeneral ? 'Saving...' : 'Save Workspace Parameters'}
              </Button>
            </div>
          </form>
        </div>

        {/* Section 2: Meta Connection & Secret Vault */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Meta Graph API Secret Vault</span>
            </h4>
            {metaConnection?.is_connected ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Connected & Vaulted
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">Token Required</Badge>
            )}
          </div>

          {/* Masked status box if already connected */}
          {metaConnection && (
            <div className="mb-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vaulted Token Mask:</span>
                <span className="font-mono text-purple-300 font-bold tracking-wider">{metaConnection.token_masked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Ad Account:</span>
                <span className="font-mono text-slate-200">{metaConnection.ad_account_id}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Active Scopes: {(metaConnection.scopes || []).join(', ')}</span>
                <span>Verified: {new Date(metaConnection.last_verified_at || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          )}


          <form onSubmit={handleSaveMetaConnection} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Meta Ad Account ID
                </label>
                <input
                  type="text"
                  required
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  placeholder="act_1234567890"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Instagram Account ID (Optional)
                </label>
                <input
                  type="text"
                  value={instagramAccountId}
                  onChange={(e) => setInstagramAccountId(e.target.value)}
                  placeholder="ig_act_9918231"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Meta System User or Graph Access Token
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showToken ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value)}
                placeholder="EAABwz..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-xl text-[11px] text-purple-300 flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-200">Zero-Exposure Server-Side Encryption</span>
                <p className="text-slate-400 mt-0.5">
                  Meta access tokens are encrypted with Fernet (AES-128-CBC + HMAC-SHA256) on the backend server before reaching PostgreSQL. Tokens are NEVER returned across client queries.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={savingMeta}
              >
                {savingMeta ? 'Encrypting & Vaulting...' : 'Save & Encrypt Meta Token'}
              </Button>
            </div>
          </form>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
