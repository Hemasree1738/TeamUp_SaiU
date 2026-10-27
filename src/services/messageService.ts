import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Conversation, Message, Profile } from '../types/database.types';

export const messageService = {
  async getConversations(userId: string): Promise<{ conversation: Conversation; partner: Profile; lastMessage?: Message; unreadCount: number }[]> {
    if (!isSupabaseConfigured) return [];

    // Get user's conversation memberships
    const { data: myMemberships, error: memErr } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (memErr) throw memErr;
    if (!myMemberships || myMemberships.length === 0) return [];

    const convIds = myMemberships.map((m) => m.conversation_id);

    // Get other members for these conversations
    const { data: allMembers, error: allMemErr } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id, user:profiles(*)')
      .in('conversation_id', convIds)
      .neq('user_id', userId);

    if (allMemErr) throw allMemErr;

    // Get latest message for each conversation
    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    if (msgErr) throw msgErr;

    const results: { conversation: Conversation; partner: Profile; lastMessage?: Message; unreadCount: number }[] = [];

    const memMap = new Map<string, string>();
    myMemberships.forEach((m) => memMap.set(m.conversation_id, m.last_read_at));

    const partnerMap = new Map<string, Profile>();
    (allMembers || []).forEach((m: any) => {
      if (m.user) partnerMap.set(m.conversation_id, m.user);
    });

    for (const convId of convIds) {
      const partner = partnerMap.get(convId);
      if (!partner) continue;

      const convMessages = (messages || []).filter((msg) => msg.conversation_id === convId);
      const lastMessage = convMessages[0];
      const lastRead = memMap.get(convId) || '1970-01-01';

      const unreadCount = convMessages.filter(
        (msg) => msg.sender_id !== userId && new Date(msg.created_at) > new Date(lastRead)
      ).length;

      results.push({
        conversation: { id: convId, created_at: '', updated_at: '' },
        partner,
        lastMessage,
        unreadCount,
      });
    }

    return results;
  },

  async getOrCreateConversation(userId: string, targetUserId: string): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // Find if a conversation already exists between userId and targetUserId
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);
      const { data: match } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', convIds)
        .maybeSingle();

      if (match) {
        return match.conversation_id;
      }
    }

    // Otherwise create new conversation
    const { data: newConv, error: createErr } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (createErr) throw createErr;

    // Add both members
    const { error: memErr } = await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: userId, last_read_at: new Date().toISOString() },
      { conversation_id: newConv.id, user_id: targetUserId, last_read_at: new Date(0).toISOString() },
    ]);

    if (memErr) throw memErr;

    return newConv.id;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (!content.trim()) throw new Error('Message cannot be empty.');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select('*, sender:profiles!sender_id(*)')
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  },

  subscribeToMessages(conversationId: string, onNewMessage: (msg: Message) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch sender profile details for complete display
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onNewMessage(data);
          } else {
            onNewMessage(payload.new as Message);
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
