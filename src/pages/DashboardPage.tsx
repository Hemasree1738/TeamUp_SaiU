import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2,
  Layers,
  UserCheck,
  FolderGit2,
  MessageSquare,
  Bell,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  Github,
  Linkedin,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { connectionService } from '../services/connectionService';
import { teamService } from '../services/teamService';
import { notificationService } from '../services/notificationService';
import { ConnectionRequest, Team, NotificationItem } from '../types/database.types';

export const DashboardPage: React.FC = () => {
  const { user, profile, isConfigured } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [incomingConnections, setIncomingConnections] = useState<ConnectionRequest[]>([]);
  const [userTeams, setUserTeams] = useState<{ ledTeams: Team[]; memberTeams: Team[] }>({
    ledTeams: [],
    memberTeams: [],
  });
  const [openTeams, setOpenTeams] = useState<Team[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingJoinRequestsCount, setPendingJoinRequestsCount] = useState(0);

  useEffect(() => {
    if (!user || !isConfigured) {
      setIsLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        const [incomingReqs, teamsData, publicTeamsRes, notifs, myJoinReqs] = await Promise.all([
          connectionService.getIncomingRequests(user.id),
          teamService.getUserTeams(user.id),
          teamService.getTeams({ recruitingStatus: 'open', pageSize: 3 }),
          notificationService.getNotifications(user.id),
          teamService.getUserJoinRequests(user.id),
        ]);

        setIncomingConnections(incomingReqs);
        setUserTeams(teamsData);
        setOpenTeams(publicTeamsRes.teams);
        setNotifications(notifs.slice(0, 5));
        setPendingJoinRequestsCount(
          myJoinReqs.filter((r) => r.status === 'pending').length
        );
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, isConfigured]);

  const handleAcceptConnection = async (reqId: string) => {
    try {
      await connectionService.acceptConnectionRequest(reqId);
      setIncomingConnections((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err) {
      console.error('Failed to accept connection:', err);
    }
  };

  const handleDeclineConnection = async (reqId: string) => {
    try {
      await connectionService.declineConnectionRequest(reqId);
      setIncomingConnections((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err) {
      console.error('Failed to decline connection:', err);
    }
  };

  const totalTeams = userTeams.ledTeams.length + userTeams.memberTeams.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-campus-border p-6 sm:p-8 overflow-hidden shadow-glow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span>{profile?.school || 'Campus Community'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Friend'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {profile?.title ? `${profile.title} • ` : ''}Here's what's going on in your campus circle today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/students">
              <Button leftIcon={<Users2 className="w-4 h-4" />}>
                Find Teammates
              </Button>
            </Link>
            <Link to="/teams/create">
              <Button variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Start a Team
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/connections" className="block group">
          <Card hoverEffect className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Connection Invites</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {isLoading ? '...' : incomingConnections.length}
              </span>
              <span className="text-[11px] text-slate-500">waiting for you</span>
            </div>
          </Card>
        </Link>

        <Link to="/my-teams" className="block group">
          <Card hoverEffect className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">My Teams</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {isLoading ? '...' : totalTeams}
              </span>
              <span className="text-[11px] text-slate-500">
                ({userTeams.ledTeams.length} you lead)
              </span>
            </div>
          </Card>
        </Link>

        <Link to="/teams" className="block group">
          <Card hoverEffect className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Team Applications</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {isLoading ? '...' : pendingJoinRequestsCount}
              </span>
              <span className="text-[11px] text-slate-500">in review</span>
            </div>
          </Card>
        </Link>

        <Link to="/notifications" className="block group">
          <Card hoverEffect className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Notifications</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {isLoading ? '...' : notifications.filter((n) => !n.read).length}
              </span>
              <span className="text-[11px] text-slate-500">unread</span>
            </div>
          </Card>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Gathering your campus updates..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Pending Connection Requests & Recruiting Teams */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending incoming connection requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">People who want to connect</h2>
                  <p className="text-xs text-slate-400">Your classmates reaching out to collaborate</p>
                </div>
                <Link
                  to="/connections"
                  className="text-xs font-medium text-campus-primary hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {incomingConnections.length === 0 ? (
                <div className="p-6 rounded-2xl border border-campus-border bg-campus-card text-center">
                  <p className="text-xs text-slate-400">You're all caught up! No connection invites right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingConnections.map((req) => (
                    <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300">
                          {req.sender?.full_name?.[0] || 'S'}
                        </div>
                        <div>
                          <Link
                            to={`/students/${req.sender_id}`}
                            className="font-bold text-sm text-white hover:text-campus-primary transition-colors"
                          >
                            {req.sender?.full_name || 'Student'}
                          </Link>
                          <p className="text-xs text-slate-400">
                            {req.sender?.title || 'Campus Member'} &bull; {req.sender?.school}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptConnection(req.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeclineConnection(req.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Featured recruiting teams */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Teams with open spots</h2>
                  <p className="text-xs text-slate-400">Great projects looking for someone like you</p>
                </div>
                <Link
                  to="/teams"
                  className="text-xs font-medium text-campus-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {openTeams.length === 0 ? (
                <div className="p-6 rounded-2xl border border-campus-border bg-campus-card text-center">
                  <p className="text-xs text-slate-400">No open teams right now. Have an idea? Be the one to start something!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {openTeams.map((team) => (
                    <Card key={team.id} hoverEffect className="p-5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-white line-clamp-1">{team.name}</h3>
                          <Badge size="sm" variant="indigo">
                            {team.project_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {team.description}
                        </p>
                        {team.open_roles && team.open_roles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {team.open_roles.slice(0, 2).map((role) => (
                              <span
                                key={role}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {role}
                              </span>
                            ))}
                            {team.open_roles.length > 2 && (
                              <span className="text-[10px] text-slate-500">
                                +{team.open_roles.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-campus-border flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Leader: <span className="text-slate-200">{team.leader?.full_name || 'Student'}</span>
                        </span>
                        <Link to={`/teams/${team.id}`}>
                          <Button size="sm" variant="outline">
                            View Team
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile summary & Quick Hub Links */}
          <div className="space-y-6">
            {/* My Profile Quick Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-base text-white shadow-glow-sm">
                  {profile?.full_name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{profile?.full_name}</h3>
                  <p className="text-xs text-indigo-400 font-medium">{profile?.title}</p>
                  <p className="text-[11px] text-slate-400">{profile?.year_of_study}</p>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-campus-border">
                {profile?.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="GitHub Profile"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile?.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Portfolio"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <div className="flex-1 text-right">
                  <Link to="/profile">
                    <Button size="sm" variant="ghost">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Quick Hub Navigation Cards */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/students"
                  className="p-3.5 rounded-xl bg-campus-card border border-campus-border hover:border-campus-primary/40 transition-colors flex flex-col gap-2"
                >
                  <Users2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Find Teammates</span>
                    <span className="text-[10px] text-slate-400">Find your people</span>
                  </div>
                </Link>

                <Link
                  to="/teams"
                  className="p-3.5 rounded-xl bg-campus-card border border-campus-border hover:border-campus-primary/40 transition-colors flex flex-col gap-2"
                >
                  <Layers className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Explore Projects</span>
                    <span className="text-[10px] text-slate-400">Browse open spots</span>
                  </div>
                </Link>

                <Link
                  to="/messages"
                  className="p-3.5 rounded-xl bg-campus-card border border-campus-border hover:border-campus-primary/40 transition-colors flex flex-col gap-2"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Messages</span>
                    <span className="text-[10px] text-slate-400">Chat with your crew</span>
                  </div>
                </Link>

                <Link
                  to="/my-teams"
                  className="p-3.5 rounded-xl bg-campus-card border border-campus-border hover:border-campus-primary/40 transition-colors flex flex-col gap-2"
                >
                  <FolderGit2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">My Teams</span>
                    <span className="text-[10px] text-slate-400">Projects &amp; invites</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
