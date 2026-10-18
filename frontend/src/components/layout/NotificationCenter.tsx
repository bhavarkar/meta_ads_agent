import React, { useState, useEffect, useRef } from 'react';
import { useClient } from '../../context/ClientContext';
import { api } from '../../services/api';
import { SystemNotification, NotificationType } from '../../types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Video,
  Layers,
  XCircle,
  CheckCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface NotificationCenterProps {
  onNavigate?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { activeClient } = useClient();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'APPROVALS' | 'ANOMALIES' | 'REPORTS'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications(activeClient?.id);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [activeClient?.id]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(notifId, activeClient?.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(activeClient?.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (!onNavigate) return;

    if (notif.notification_type === 'REEL_APPROVAL_REQUIRED' || notif.notification_type.startsWith('PUBLICATION')) {
      onNavigate('reels');
    } else if (notif.notification_type === 'CAMPAIGN_APPROVAL_PENDING') {
      onNavigate('campaigns');
    } else if (notif.notification_type === 'ANOMALY_DETECTED' || notif.notification_type === 'WEEKLY_REPORT_READY') {
      onNavigate('automations');
    } else if (notif.action_url) {
      const route = notif.action_url.replace('/', '');
      onNavigate(route || 'automations');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'APPROVALS') {
      return n.notification_type === 'REEL_APPROVAL_REQUIRED' || n.notification_type === 'CAMPAIGN_APPROVAL_PENDING';
    }
    if (activeFilter === 'ANOMALIES') {
      return n.notification_type === 'ANOMALY_DETECTED';
    }
    if (activeFilter === 'REPORTS') {
      return n.notification_type === 'WEEKLY_REPORT_READY';
    }
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'REEL_APPROVAL_REQUIRED':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'CAMPAIGN_APPROVAL_PENDING':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'PUBLICATION_SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'PUBLICATION_FAILED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'ANOMALY_DETECTED':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'WEEKLY_REPORT_READY':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications & Approval Alerts"
        className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5 shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto text-[11px]">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('APPROVALS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeFilter === 'APPROVALS'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Approvals
            </button>
            <button
              onClick={() => setActiveFilter('ANOMALIES')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeFilter === 'ANOMALIES'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Anomalies
            </button>
            <button
              onClick={() => setActiveFilter('REPORTS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeFilter === 'REPORTS'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Reports
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No notifications in this filter</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Automated checks run on schedule to detect changes
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors relative flex gap-3 ${
                    !notif.read ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                  }`}
                >
                  {/* Icon badge */}
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                      {getIcon(notif.notification_type)}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold truncate ${
                        !notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(notif.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-2 flex items-center justify-between pt-1">
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                        Take action <ChevronRight className="w-3 h-3" />
                      </span>

                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-3.5 right-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('automations');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              Open Automations & Approvals Center <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
