import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { NotificationItem } from '../types/database.types';

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as any;
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  subscribeToNotifications(userId: string, onNewNotification: (notif: NotificationItem) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select('*, actor:profiles!actor_id(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onNewNotification(data as any);
          } else {
            onNewNotification(payload.new as any);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
