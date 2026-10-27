import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  ShieldAlert,
  Ban,
  ArrowLeft,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/messageService';
import { connectionService } from '../services/connectionService';
import { Message, Profile, Conversation } from '../types/database.types';

export const MessagesPage: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConvParam = searchParams.get('conversation');

  const [conversations, setConversations] = useState<
    { conversation: Conversation; partner: Profile; lastMessage?: Message; unreadCount: number }[]
  >([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(selectedConvParam);
  const [activePartner, setActivePartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Moderation modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations list
  const loadConversations = async () => {
    if (!user || !isConfigured) {
      setIsLoadingList(false);
      return;
    }

    try {
      const list = await messageService.getConversations(user.id);
      setConversations(list);

      // Select conversation from param or default to first
      if (selectedConvParam) {
        const found = list.find((c) => c.conversation.id === selectedConvParam);
        if (found) {
          setActiveConvId(selectedConvParam);
          setActivePartner(found.partner);
        }
      } else if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].conversation.id);
        setActivePartner(list[0].partner);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, isConfigured, selectedConvParam]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!activeConvId || !user) return;

    setIsLoadingMessages(true);
    messageService
      .getMessages(activeConvId)
      .then((msgs) => {
        setMessages(msgs);
        scrollToBottom();
        // Mark as read
        messageService.markConversationRead(activeConvId, user.id);
      })
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false));

    // Subscribe to new realtime messages
    const subscription = messageService.subscribeToMessages(activeConvId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();
      if (user) {
        messageService.markConversationRead(activeConvId, user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeConvId, user]);

  const handleSelectConversation = (convId: string, partner: Profile) => {
    setActiveConvId(convId);
    setActivePartner(partner);
    setSearchParams({ conversation: convId });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || !user) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const sentMsg = await messageService.sendMessage(activeConvId, user.id, content);
      setMessages((prev) => [...prev, sentMsg]);
      scrollToBottom();
      // Refresh conversation list preview
      loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBlockPartner = async () => {
    if (!user || !activePartner) return;
    if (window.confirm(`Are you sure you want to block ${activePartner.full_name}? They will no longer be able to message you.`)) {
      try {
        await connectionService.blockUser(user.id, activePartner.id);
        alert('User blocked.');
        setActiveConvId(null);
        setActivePartner(null);
        await loadConversations();
      } catch (err: any) {
        alert(err.message || 'Failed to block user.');
      }
    }
  };

  const handleReportConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activePartner || !reportReason.trim()) return;

    try {
      await connectionService.reportEntity(user.id, {
        reported_user_id: activePartner.id,
        reason: reportReason.trim(),
      });
      alert('Report submitted to campus moderation.');
      setIsReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to report.');
    }
  };

  if (isLoadingList) {
    return <LoadingSpinner message="Opening chat room..." />;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            <span>Messages & Collaboration</span>
          </h1>
          <p className="text-xs text-slate-400">
            Private 1-on-1 messaging with your university team collaborators.
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex-1 p-0 overflow-hidden flex divide-x divide-campus-border">
        {/* Left pane: Conversations List */}
        <div className={`w-full md:w-80 flex flex-col bg-campus-card shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-campus-border">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Conversations ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-campus-border/60">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No conversations yet. Introduce yourself to classmates in Find Teammates to start collaborating!
              </div>
            ) : (
              conversations.map(({ conversation, partner, lastMessage, unreadCount }) => {
                const isActive = activeConvId === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id, partner)}
                    className={`w-full text-left p-4 transition-colors flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-campus-primary/15 border-l-4 border-campus-primary'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                      {partner.full_name?.[0] || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-white truncate">
                          {partner.full_name}
                        </span>
                        {unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-campus-primary text-[10px] font-bold text-white flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {lastMessage ? lastMessage.content : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Active Conversation Messages */}
        <div className={`flex-1 flex flex-col bg-slate-950/40 min-w-0 ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConvId && activePartner ? (
            <>
              {/* Partner chat header */}
              <div className="h-16 px-6 border-b border-campus-border flex items-center justify-between shrink-0 bg-campus-card/60 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-xs text-white">
                    {activePartner.full_name?.[0] || 'P'}
                  </div>
                  <div>
                    <Link
                      to={`/students/${activePartner.id}`}
                      className="font-bold text-xs text-white hover:text-campus-primary transition-colors"
                    >
                      {activePartner.full_name}
                    </Link>
                    <p className="text-[10px] text-slate-400">{activePartner.title || activePartner.school}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Report Conversation"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleBlockPartner}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Block User"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {isLoadingMessages ? (
                  <LoadingSpinner message="Retrieving messages..." />
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Sparkles className="w-8 h-8 text-campus-primary mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-300">
                      Beginning of direct conversation with {activePartner.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                      Say hello and discuss hackathon goals, open roles, and tech stacks.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-campus-primary text-white rounded-br-xs'
                              : 'bg-campus-card border border-campus-border text-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-campus-border bg-campus-card/80 flex items-center gap-3 shrink-0"
              >
                <input
                  type="text"
                  placeholder={`Message ${activePartner.full_name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-900 border border-campus-border py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputText.trim()}
                  isLoading={isSending}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No Conversation Selected</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Choose a conversation from the sidebar or connect with a student in Form Teams to begin.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Inappropriate Conversation"
        description="Help us maintain a safe, respectful university environment."
      >
        <form onSubmit={handleReportConversation} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Reason for Report
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the inappropriate behavior, harassment, or spam..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-campus-border p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm">
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
