import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Settings,
  ShieldCheck,
  Key,
  Database,
  Sliders,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isDemoMode, setDemoMode } = useAuth();
  const { activeClient } = useClient();
  const [adAccountId, setAdAccountId] = useState('act_4829104820');
  const [appId, setAppId] = useState('291048201948201');
  const [appSecret, setAppSecret] = useState('••••••••••••••••••••••••••••••••');
  const [accessToken, setAccessToken] = useState('EAACEdEose0cBA••••••••••••••••••••••••••••••••••••••••••••••');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeClient) {
      setAdAccountId(activeClient.meta_ad_account_id || 'act_4829104820');
      api.getMetaConnection(activeClient.id)
        .then(conn => {
          if (conn) {
            if (conn.ad_account_id) setAdAccountId(conn.ad_account_id);
            if (conn.meta_app_id) setAppId(conn.meta_app_id);
            if (conn.token_masked) setAccessToken(conn.token_masked);
          }
        })
        .catch(console.warn);
    }
  }, [activeClient?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;
    setSaving(true);
    try {
      await api.saveMetaConnection(activeClient.id, {
        ad_account_id: adAccountId,
        access_token: accessToken.includes('••••') ? 'EAACEdEose0cBAdemo_active_token_saved' : accessToken,
        meta_app_id: appId
      });
      setSaveStatus(`Integration credentials encrypted & saved for ${activeClient.name}`);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setSaveStatus(`Error saving credentials: ${err.message || 'Validation failed'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>System &amp; API Integration Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Meta Marketing API v19.0, Instagram Graph API, Supabase Auth RLS, and AI agent execution credentials.
        </p>
      </div>

      {/* Execution Mode Selector Card */}
      <Card>
        <CardHeader
          title="Runtime Execution Mode"
          subtitle="Toggle between offline synthetic demo data and live Meta APIs"
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setDemoMode(true)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isDemoMode
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/20'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-100 text-sm">Demo Mode (Active)</span>
                {isDemoMode && <Badge variant="purple" size="sm">Enabled</Badge>}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Runs completely offline using realistic synthetic ad metrics, competitor feeds, and simulated Instagram Reels publishing without needing real API keys.
              </p>
            </div>

            <div
              onClick={() => setDemoMode(false)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                !isDemoMode
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-100 text-sm">Connected Mode</span>
                {!isDemoMode && <Badge variant="success" size="sm">Enabled</Badge>}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects directly to official Meta Graph API v19.0 and Instagram Graph API using authenticated System User access tokens and Ad Account IDs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta API Settings */}
      <Card>
        <CardHeader
          title="Official Meta Marketing &amp; Instagram Graph API"
          subtitle="Configure developer credentials and ad account IDs"
        />
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Target Ad Account ID</label>
                <input
                  type="text"
                  value={adAccountId}
                  onChange={e => setAdAccountId(e.target.value)}
                  placeholder="act_123456789"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Meta App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={e => setAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                System User / Long-Lived User Access Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Key className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Required permissions: ads_management, ads_read, instagram_basic, instagram_content_publish
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveStatus ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {saveStatus}
                </span>
              ) : <div />}
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? 'Encrypting & Storing...' : 'Save Integration Credentials'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Supabase & LangGraph Configuration Status */}
      <Card>
        <CardHeader
          title="Security &amp; AI Engine Health"
          subtitle="Infrastructure and tenant isolation parameters"
        />
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-200 block">Supabase Row-Level Security (RLS)</span>
                <span className="text-[11px] text-slate-400">Strict tenant isolation policies enforced on all tables</span>
              </div>
            </div>
            <Badge variant="success" size="sm">Active &amp; Guarded</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-bold text-slate-200 block">LangGraph Strategy Orchestration</span>
                <span className="text-[11px] text-slate-400">Model: OpenAI gpt-4o-mini structured schema outputs</span>
              </div>
            </div>
            <Badge variant="purple" size="sm">Operational</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
