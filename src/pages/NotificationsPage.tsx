import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  UserCheck,
  FolderGit2,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/database.types';

export const NotificationsPage: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user || !isConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const items = await notificationService.getNotifications(user.id);
      setNotifications(items);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, isConfigured]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('connection')) return <UserCheck className="w-5 h-5 text-indigo-400" />;
    if (type.includes('team')) return <FolderGit2 className="w-5 h-5 text-purple-400" />;
    if (type.includes('message')) return <MessageSquare className="w-5 h-5 text-emerald-400" />;
    return <Sparkles className="w-5 h-5 text-cyan-400" />;
  };

  if (isLoading) return <LoadingSpinner message="Checking campus notifications..." />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-cyan-400" />
            <span>Activity & Notifications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time campus updates on connection requests, team invites, and project applications.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All Caught Up!"
          description="When teammates send connection invites, project updates, or team messages, you'll see them right here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card
              key={item.id}
              onClick={() => !item.read && handleMarkAsRead(item.id)}
              className={`p-4 transition-all flex items-start justify-between gap-4 ${
                !item.read
                  ? 'bg-campus-card border-campus-primary/30 shadow-glow-sm'
                  : 'bg-campus-card/50 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-campus-border shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-white">{item.title}</h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-campus-primary" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(item.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {item.link && (
                <Link
                  to={item.link}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                  title="Go to resource"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
