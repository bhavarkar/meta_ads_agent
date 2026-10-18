import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OrganizationMember, MemberRole } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Mail,
  Building2,
  Crown,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const TeamManagementPage: React.FC = () => {
  const { user, activeOrg } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'agency_admin';

  const loadMembers = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      const data = await api.getMembers(activeOrg.id);
      setMembers(data);
    } catch (err: any) {
      console.warn("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeOrg?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    setSubmitting(true);
    setNotification(null);
    try {
      const newMember = await api.inviteMember(activeOrg.id, {
        email: inviteEmail,
        role: inviteRole
      });
      setMembers(prev => [...prev, newMember]);
      setIsInviteOpen(false);
      setInviteEmail('');
      setNotification({
        type: 'success',
        message: `Invitation successfully sent to ${inviteEmail} as ${inviteRole.toUpperCase()}`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to send invitation.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!activeOrg) return;
    try {
      await api.updateMemberRole(activeOrg.id, memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      setNotification({
        type: 'success',
        message: 'Member role updated successfully.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to update member role.'
      });
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!activeOrg) return;
    if (!window.confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    try {
      await api.removeMember(activeOrg.id, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setNotification({
        type: 'success',
        message: `Access revoked for ${email}.`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to remove member.'
      });
    }
  };

  const getRoleBadge = (role: MemberRole | string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="purple" size="sm"><Crown className="w-3 h-3 mr-1 inline" />Owner</Badge>;
      case 'admin':
        return <Badge variant="info" size="sm"><ShieldCheck className="w-3 h-3 mr-1 inline" />Admin</Badge>;
      case 'member':
        return <Badge variant="default" size="sm">Member</Badge>;
      case 'viewer':
        return <Badge variant="warning" size="sm">Viewer (Read-Only)</Badge>;
      default:
        return <Badge variant="default" size="sm">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Team & Access Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization teammates, permissions, and cross-client authorization for <span className="text-slate-200 font-semibold">{activeOrg?.name}</span>.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteOpen(true)}
          >
            Invite Teammate
          </Button>
        )}
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs border ${
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

      {/* Org Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Organization</span>
              <p className="text-sm font-bold text-slate-100">{activeOrg?.name}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Your Tenant Role</span>
              <p className="text-sm font-bold text-slate-100 capitalize">{user?.role || 'member'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Security Scope</span>
              <p className="text-sm font-bold text-emerald-400">Isolated Tenant</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="border-slate-800 bg-slate-900/80 overflow-hidden">
        <CardHeader
          title="Organization Members"
          subtitle="Teammates who can access this organization's client workspaces"
          action={
            <span className="text-xs text-slate-400 font-medium">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-5 font-semibold">Member</th>
                  <th className="py-3 px-5 font-semibold">Role</th>
                  <th className="py-3 px-5 font-semibold">Joined Date</th>
                  <th className="py-3 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map(member => {
                  const isCurrent = (user && member.user_id === user.id) || (user && member.email === user.email);
                  const isMemberOwner = member.role === 'owner';
                  return (

                    <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (member.full_name || member.email)[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>{member.full_name || member.email.split('@')[0]}</span>
                              {isCurrent && (
                                <span className="text-[10px] text-indigo-400 font-normal">(You)</span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[11px] font-mono">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {isOwnerOrAdmin && !isMemberOwner && !isCurrent ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          getRoleBadge(member.role)
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isOwnerOrAdmin && !isMemberOwner && !isCurrent ? (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleRemoveMember(member.id, member.email)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <span className="text-slate-600 text-[11px] italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Definitions Guide */}
      <Card className="p-5 bg-slate-900/40 border-slate-800">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Role Permissions Matrix
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Owner</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Full administrative authority. Manages billing, tenant deletion, member roles, and client workspace allocations.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-bold text-indigo-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Invites teammates, binds client Meta tokens securely, approves live campaign activations, and edits client budgets.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Member</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Creates campaign drafts (saved as PAUSED), triggers AI strategies, publishes Reels, and inspects competitor data.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Viewer</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Read-only client reporting. Accesses performance analytics and recommendation summaries without modification rights.
            </p>
          </div>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Teammate to Organization"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Teammate Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@agency.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Access Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="admin">Admin - Can manage clients, team & Meta tokens</option>
              <option value="member">Member - Can create campaigns & Reels</option>
              <option value="viewer">Viewer - Read-only analytics & reporting</option>
            </select>
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>The invitee will only be able to view clients within {activeOrg?.name}. Cross-tenant access is prohibited.</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
            >
              {submitting ? 'Sending Invite...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
