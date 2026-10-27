import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ConnectionRequest, Profile } from '../types/database.types';

export const connectionService = {
  async sendConnectionRequest(senderId: string, receiverId: string): Promise<ConnectionRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    if (senderId === receiverId) {
      throw new Error('You cannot connect with yourself.');
    }

    // Check if already pending or accepted
    const { data: existing } = await supabase
      .from('connection_requests')
      .select('*')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('You are already connected with this student.');
      }
      throw new Error('A connection request is already pending between you.');
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select('*, receiver:profiles!receiver_id(*)')
      .single();

    if (error) throw error;

    // Send in-app notification to receiver
    await supabase.from('notifications').insert({
      user_id: receiverId,
      actor_id: senderId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'A student sent you a connection request.',
      link: '/connections',
    });

    return data;
  },

  async acceptConnectionRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // Use RPC if available, otherwise direct update
    const { error: rpcError } = await supabase.rpc('accept_connection_request', {
      req_id: requestId,
    });

    if (rpcError) {
      // Direct update fallback
      const { data: req, error: fetchErr } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('sender_id, receiver_id')
        .single();

      if (fetchErr) throw fetchErr;

      // Notification
      if (req) {
        await supabase.from('notifications').insert({
          user_id: req.sender_id,
          actor_id: req.receiver_id,
          type: 'connection_accepted',
          title: 'Connection Accepted',
          message: 'Your connection request was accepted.',
          link: `/students/${req.receiver_id}`,
        });
      }
    }
  },

  async declineConnectionRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
  },

  async cancelConnectionRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
  },

  async getIncomingRequests(userId: string): Promise<(ConnectionRequest & { sender: Profile })[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('connection_requests')
      .select('*, sender:profiles!sender_id(*)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async getOutgoingRequests(userId: string): Promise<(ConnectionRequest & { receiver: Profile })[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('connection_requests')
      .select('*, receiver:profiles!receiver_id(*)')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async getAcceptedConnections(userId: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('connection_requests')
      .select('sender_id, receiver_id, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    const list: Profile[] = [];
    (data || []).forEach((row: any) => {
      if (row.sender_id === userId && row.receiver) {
        list.push(row.receiver);
      } else if (row.receiver_id === userId && row.sender) {
        list.push(row.sender);
      }
    });

    return list;
  },

  async getConnectionStatus(
    currentUserId: string,
    targetUserId: string
  ): Promise<{ status: 'none' | 'pending_sent' | 'pending_received' | 'connected'; requestId?: string }> {
    if (!isSupabaseConfigured || !currentUserId || !targetUserId) {
      return { status: 'none' };
    }

    const { data } = await supabase
      .from('connection_requests')
      .select('id, sender_id, receiver_id, status')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
      )
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

    if (!data) return { status: 'none' };

    if (data.status === 'accepted') {
      return { status: 'connected', requestId: data.id };
    }

    if (data.status === 'pending') {
      if (data.sender_id === currentUserId) {
        return { status: 'pending_sent', requestId: data.id };
      } else {
        return { status: 'pending_received', requestId: data.id };
      }
    }

    return { status: 'none' };
  },

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase.from('blocks').insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

    if (error && error.code !== '23505') {
      // Ignore duplicate block error
      throw error;
    }
  },

  async reportEntity(
    reporterId: string,
    data: { reported_user_id?: string; reported_team_id?: string; reported_message_id?: string; reason: string }
  ): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      ...data,
    });

    if (error) throw error;
  },
};
