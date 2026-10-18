import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ShieldCheck, Search, Filter, Lock, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs()
      .then(res => setLogs(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.actor_email.toLowerCase().includes(search.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Enterprise Security Audit &amp; Compliance Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all campaign budget approvals, status changes, Reel publications, and AI recommendation executions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, actor, or resource..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader
          title={`Audit Events Log (${filteredLogs.length})`}
          subtitle="Append-only record with IP tracking and cryptographic authorization tokens"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Audit Payload Details</th>
                <th className="py-3 px-5 text-right">IP Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-5 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    <Badge
                      variant={
                        log.action.includes('APPROVAL')
                          ? 'purple'
                          : log.action.includes('ACTIVATED') || log.action.includes('PUBLISHED')
                          ? 'success'
                          : log.action.includes('PAUSED')
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.actor_email}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="text-indigo-400 font-bold">{log.resource_type}:</span> {log.resource_id}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="py-3 px-5 text-right text-slate-500">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
