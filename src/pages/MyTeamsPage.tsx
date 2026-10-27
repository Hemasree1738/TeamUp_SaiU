import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  PlusCircle,
  Crown,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { teamService } from '../services/teamService';
import { Team, TeamInvitation, TeamJoinRequest } from '../types/database.types';

export const MyTeamsPage: React.FC = () => {
  const { user, isConfigured } = useAuth();

  const [ledTeams, setLedTeams] = useState<Team[]>([]);
  const [memberTeams, setMemberTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [myApplications, setMyApplications] = useState<TeamJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user || !isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [teamsData, invites, apps] = await Promise.all([
        teamService.getUserTeams(user.id),
        teamService.getUserInvitations(user.id),
        teamService.getUserJoinRequests(user.id),
      ]);

      setLedTeams(teamsData.ledTeams);
      setMemberTeams(teamsData.memberTeams);
      setInvitations(invites);
      setMyApplications(apps);
    } catch (err) {
      console.error('Error fetching my teams data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isConfigured]);

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await teamService.acceptInvitation(invitationId);
      alert('You have joined the team!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation.');
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    try {
      await teamService.declineInvitation(invitationId);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation.');
    }
  };

  const handleCancelApplication = async (requestId: string) => {
    try {
      await teamService.cancelJoinRequest(requestId);
      setMyApplications((prev) => prev.filter((a) => a.id !== requestId));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel application.');
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your teams and invitations..." />;

  const pendingApps = myApplications.filter((a) => a.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-purple-400" />
            <span>My Teams &amp; Projects</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Projects you lead, collaborations you have joined, and invitations awaiting your response.
          </p>
        </div>

        <Link to="/teams/create">
          <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
            Start a Project Team
          </Button>
        </Link>
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <Card className="p-6 border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 to-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Team Invitations Received ({invitations.length})</span>
          </h2>

          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-campus-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {inv.team?.name || 'Project Team'}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium">
                    Invited as: {inv.role}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Invited by {inv.inviter?.full_name || 'Leader'} &bull; {inv.team?.project_type?.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(inv.id)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeclineInvite(inv.id)}
                    leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Teams Led */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Projects You Lead ({ledTeams.length})</span>
          </h2>
        </div>

        {ledTeams.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="You haven't started a team yet"
            description="Have an inspiring hackathon idea or research topic? Take the lead and gather your collaborators!"
            actionLabel="Start a Project Team"
            onAction={() => (window.location.href = '/teams/create')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ledTeams.map((team) => (
              <Card key={team.id} hoverEffect className="p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="indigo" size="sm">
                      {team.project_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Team Lead
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white line-clamp-1">{team.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2">{team.description}</p>

                  <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Capacity: {team.max_capacity}</span>
                    <span className="text-indigo-400 capitalize">{team.recruiting_status}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-campus-border flex justify-end">
                  <Link to={`/teams/${team.id}`}>
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Manage Team
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Member Teams */}
      <div className="space-y-4 pt-6 border-t border-campus-border">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-campus-primary" />
          <span>Projects You&apos;ve Joined ({memberTeams.length})</span>
        </h2>

        {memberTeams.length === 0 ? (
          <div className="p-6 rounded-2xl border border-campus-border bg-campus-card text-center">
            <p className="text-xs text-slate-400">You haven&apos;t joined any other teams yet. Explore open projects to find one that matches your passions!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberTeams.map((team) => (
              <Card key={team.id} hoverEffect className="p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <Badge variant="violet" size="sm">
                    {team.project_type.replace('_', ' ')}
                  </Badge>
                  <h3 className="font-bold text-base text-white line-clamp-1">{team.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2">{team.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-campus-border flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Leader: {team.leader?.full_name || 'Leader'}
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

      {/* Pending Applications submitted */}
      {pendingApps.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-campus-border">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Pending Join Applications ({pendingApps.length})</span>
          </h2>

          <div className="space-y-2">
            {pendingApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-slate-900 border border-campus-border flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm text-white">{app.team?.name || 'Project Team'}</h4>
                  <p className="text-xs text-slate-400">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/teams/${app.team_id}`}>
                    <Button size="sm" variant="ghost">
                      View Team
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelApplication(app.id)}
                    className="text-xs text-rose-400"
                  >
                    Cancel Application
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
