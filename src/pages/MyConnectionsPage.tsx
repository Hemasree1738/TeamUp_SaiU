import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Clock,
  Check,
  X,
  MessageSquare,
  ExternalLink,
  Users2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { connectionService } from '../services/connectionService';
import { messageService } from '../services/messageService';
import { Profile, ConnectionRequest } from '../types/database.types';

export const MyConnectionsPage: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'connected' | 'incoming' | 'outgoing'>('connected');
  const [connections, setConnections] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<(ConnectionRequest & { sender: Profile })[]>([]);
  const [outgoing, setOutgoing] = useState<(ConnectionRequest & { receiver: Profile })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user || !isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [conns, inReqs, outReqs] = await Promise.all([
        connectionService.getAcceptedConnections(user.id),
        connectionService.getIncomingRequests(user.id),
        connectionService.getOutgoingRequests(user.id),
      ]);

      setConnections(conns);
      setIncoming(inReqs);
      setOutgoing(outReqs);
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isConfigured]);

  const handleAccept = async (requestId: string) => {
    try {
      await connectionService.acceptConnectionRequest(requestId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept request.');
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await connectionService.declineConnectionRequest(requestId);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      alert(err.message || 'Failed to decline request.');
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await connectionService.cancelConnectionRequest(requestId);
      setOutgoing((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request.');
    }
  };

  const handleMessage = async (targetUserId: string) => {
    if (!user) return;
    try {
      const convId = await messageService.getOrCreateConversation(user.id, targetUserId);
      navigate(`/messages?conversation=${convId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to open conversation.');
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your connection network..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-campus-primary" />
            <span>My Campus Network</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build lasting project partnerships and discover fellow innovators across your university.
          </p>
        </div>

        <Link to="/students">
          <Button leftIcon={<UserPlus className="w-4 h-4" />}>
            Discover Classmates
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-campus-border pb-2">
        <button
          onClick={() => setActiveTab('connected')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'connected'
              ? 'bg-campus-primary text-white shadow-glow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Connected ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-campus-primary text-white shadow-glow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Incoming Invites</span>
          {incoming.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-900 text-indigo-200 text-[10px]">
              {incoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'outgoing'
              ? 'bg-campus-primary text-white shadow-glow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Sent Invites ({outgoing.length})
        </button>
      </div>

      {/* TAB CONTENT: CONNECTED */}
      {activeTab === 'connected' && (
        <>
          {connections.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No Connections Yet"
              description="Head over to Find Teammates to discover peers working on projects you love and connect directly!"
              actionLabel="Discover Classmates"
              onAction={() => navigate('/students')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((student) => (
                <Card key={student.id} hoverEffect className="p-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-base text-white shadow-glow-sm shrink-0">
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.full_name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          student.full_name?.[0] || 'S'
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/students/${student.id}`}
                          className="font-bold text-sm text-white hover:text-campus-primary transition-colors line-clamp-1"
                        >
                          {student.full_name}
                        </Link>
                        <p className="text-xs text-campus-primary font-medium line-clamp-1">
                          {student.title || 'Student'}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{student.school}</p>
                      </div>
                    </div>

                    {student.bio && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                        &ldquo;{student.bio}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-campus-border flex items-center justify-between gap-2">
                    <Link to={`/students/${student.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleMessage(student.id)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Message
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: INCOMING */}
      {activeTab === 'incoming' && (
        <div className="space-y-3">
          {incoming.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-campus-card border border-campus-border">
              <p className="text-xs text-slate-400">No incoming connection requests at this time.</p>
            </div>
          ) : (
            incoming.map((req) => (
              <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center">
                    {req.sender?.full_name?.[0] || 'S'}
                  </div>
                  <div>
                    <Link
                      to={`/students/${req.sender_id}`}
                      className="font-bold text-sm text-white hover:text-campus-primary"
                    >
                      {req.sender?.full_name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {req.sender?.title || 'Student'} &bull; {req.sender?.school}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Sent {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(req.id)}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDecline(req.id)}
                    leftIcon={<X className="w-3.5 h-3.5 text-rose-400" />}
                  >
                    Decline
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: OUTGOING */}
      {activeTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoing.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-campus-card border border-campus-border">
              <p className="text-xs text-slate-400">You haven&apos;t sent any connection invites yet. Reach out to someone whose skills or project goals inspire you!</p>
            </div>
          ) : (
            outgoing.map((req) => (
              <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center">
                    {req.receiver?.full_name?.[0] || 'S'}
                  </div>
                  <div>
                    <Link
                      to={`/students/${req.receiver_id}`}
                      className="font-bold text-sm text-white hover:text-campus-primary"
                    >
                      {req.receiver?.full_name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {req.receiver?.title || 'Student'} &bull; {req.receiver?.school}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancel(req.id)}
                    className="text-xs text-slate-400 hover:text-rose-400"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
