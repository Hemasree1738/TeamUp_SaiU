import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Github,
  Linkedin,
  ExternalLink,
  Plus,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { teamService } from '../services/teamService';
import { connectionService } from '../services/connectionService';
import { Team, TeamMember, TeamJoinRequest, Profile } from '../types/database.types';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<(Team & { leader: Profile; members: (TeamMember & { user: Profile })[] }) | null>(null);
  const [joinRequests, setJoinRequests] = useState<(TeamJoinRequest & { applicant: Profile })[]>([]);
  const [userPendingRequest, setUserPendingRequest] = useState<TeamJoinRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  // Invite Modal state (for team leaders)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [connections, setConnections] = useState<Profile[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [isInviting, setIsInviting] = useState(false);

  // Role edit modal
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newRoleTitle, setNewRoleTitle] = useState('');

  const loadTeamData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await teamService.getTeamById(id);
      setTeam(data);

      if (user && data) {
        // If current user is leader, fetch join requests
        if (data.leader_id === user.id) {
          const reqs = await teamService.getTeamJoinRequests(id);
          setJoinRequests(reqs);

          // Also load leader's connections for invitations
          const conns = await connectionService.getAcceptedConnections(user.id);
          // Filter out existing members
          const memberUserIds = (data.members || []).map((m) => m.user_id);
          setConnections(conns.filter((c) => !memberUserIds.includes(c.id)));
        } else {
          // Check if current user has an active application
          const userApps = await teamService.getUserJoinRequests(user.id);
          const activeApp = userApps.find((a) => a.team_id === id && a.status === 'pending');
          setUserPendingRequest(activeApp || null);
        }
      }
    } catch (err) {
      console.error('Error fetching team detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setIsSubmittingApplication(true);
    try {
      const app = await teamService.submitJoinRequest(id, user.id, applyMessage.trim());
      setUserPendingRequest(app);
      setIsApplyModalOpen(false);
      setApplyMessage('');
      alert('Application submitted! The team leader has been notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!userPendingRequest) return;
    if (window.confirm('Are you sure you want to cancel your join request?')) {
      try {
        await teamService.cancelJoinRequest(userPendingRequest.id);
        setUserPendingRequest(null);
      } catch (err: any) {
        alert(err.message || 'Failed to cancel application.');
      }
    }
  };

  const handleAcceptApplication = async (requestId: string) => {
    try {
      await teamService.acceptJoinRequest(requestId);
      alert('Student has been added to the team roster!');
      await loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept application.');
    }
  };

  const handleDeclineApplication = async (requestId: string) => {
    try {
      await teamService.declineJoinRequest(requestId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      alert(err.message || 'Failed to decline application.');
    }
  };

  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !selectedConnectionId) return;

    setIsInviting(true);
    try {
      await teamService.inviteStudent(id, user.id, selectedConnectionId, inviteRole.trim());
      alert('Invitation sent successfully!');
      setIsInviteModalOpen(false);
      setSelectedConnectionId('');
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!id) return;
    if (window.confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
      try {
        await teamService.removeMember(id, memberUserId);
        await loadTeamData();
      } catch (err: any) {
        alert(err.message || 'Failed to remove member.');
      }
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingMember || !newRoleTitle.trim()) return;

    try {
      await teamService.updateMemberRole(id, editingMember.user_id, newRoleTitle.trim());
      setEditingMember(null);
      await loadTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleToggleRecruiting = async () => {
    if (!team) return;
    const nextStatus = team.recruiting_status === 'open' ? 'closed' : 'open';
    try {
      await teamService.updateTeam(team.id, { recruiting_status: nextStatus });
      setTeam({ ...team, recruiting_status: nextStatus });
    } catch (err: any) {
      alert(err.message || 'Failed to update recruiting status.');
    }
  };

  if (isLoading) return <LoadingSpinner message="Gathering project details..." />;

  if (!team) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-slate-400">This project has wrapped up, changed names, or is no longer active.</p>
        <Link to="/teams">
          <Button variant="outline" size="sm">
            Back to Explore Projects
          </Button>
        </Link>
      </div>
    );
  }

  const isLeader = user?.id === team.leader_id;
  const isMember = (team.members || []).some((m) => m.user_id === user?.id);
  const currentCount = team.members?.length || 1;
  const isAtCapacity = currentCount >= team.max_capacity;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Main Team Info Header Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-campus-border">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  team.project_type === 'hackathon'
                    ? 'indigo'
                    : team.project_type === 'research'
                    ? 'emerald'
                    : team.project_type === 'competition'
                    ? 'amber'
                    : 'cyan'
                }
              >
                {team.project_type.replace('_', ' ')}
              </Badge>

              <button
                type="button"
                onClick={isLeader ? handleToggleRecruiting : undefined}
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                  team.recruiting_status === 'open'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                } ${isLeader ? 'hover:scale-105 cursor-pointer' : ''}`}
                title={isLeader ? 'Click to toggle recruiting status' : undefined}
              >
                {team.recruiting_status === 'open' ? 'Welcoming Teammates' : 'Roster Full'}
                {isLeader && ' (Toggle)'}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {team.name}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Initiated by</span>
              <Link
                to={`/students/${team.leader_id}`}
                className="font-bold text-campus-primary hover:underline"
              >
                {team.leader?.full_name || 'Leader'}
              </Link>
            </p>
          </div>

          {/* Action Button: Apply / Invite / Manage */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
            {isLeader ? (
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Invite Connections
              </Button>
            ) : isMember ? (
              <Badge variant="emerald" size="md">
                Active Teammate
              </Badge>
            ) : userPendingRequest ? (
              <Button
                variant="outline"
                onClick={handleCancelApplication}
                leftIcon={<Clock className="w-4 h-4 text-amber-400" />}
                className="text-amber-400 hover:text-rose-400"
                title="Click to cancel application"
              >
                Application In Review (Cancel)
              </Button>
            ) : isAtCapacity ? (
              <Button disabled variant="outline">
                All Spots Filled ({currentCount}/{team.max_capacity})
              </Button>
            ) : team.recruiting_status === 'closed' ? (
              <Button disabled variant="outline">
                Roster Complete
              </Button>
            ) : (
              <Button onClick={() => setIsApplyModalOpen(true)}>
                Apply to Join Team
              </Button>
            )}
          </div>
        </div>

        {/* Overview & Mission */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            About This Project
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {team.description}
          </p>
        </div>

        {/* Objective */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Goals &amp; What We&apos;re Building
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            {team.project_objective}
          </p>
        </div>

        {/* Open Roles & Required Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-campus-border">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Open Roles Needed ({team.open_roles?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {team.open_roles && team.open_roles.length > 0 ? (
                team.open_roles.map((role) => (
                  <Badge key={role} variant="indigo">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No specific roles listed right now.</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Tech Stack &amp; Skills We Use
            </h3>
            <div className="flex flex-wrap gap-2">
              {team.required_skills && team.required_skills.length > 0 ? (
                team.required_skills.map((skill) => (
                  <Badge key={skill} variant="violet">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Open to all skill sets.</span>
              )}
            </div>
          </div>
        </div>

        {/* Meta Stats & Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-campus-border text-xs">
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Capacity</span>
            <span className="text-slate-200 font-medium">
              {currentCount} / {team.max_capacity} members
            </span>
          </div>

          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Commitment</span>
            <span className="text-slate-200 font-medium">{team.commitment || 'Flexible'}</span>
          </div>

          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Target Deadline</span>
            <span className="text-slate-200 font-medium">
              {team.deadline ? new Date(team.deadline).toLocaleDateString() : 'Rolling deadline'}
            </span>
          </div>
        </div>

        {/* External Links */}
        {(team.github_url || team.linkedin_url || team.project_url) && (
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-campus-border">
            {team.github_url && (
              <a
                href={team.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Repository</span>
              </a>
            )}
            {team.linkedin_url && (
              <a
                href={team.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                <span>Showcase</span>
              </a>
            )}
            {team.project_url && (
              <a
                href={team.project_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Project / Hackathon Site</span>
              </a>
            )}
          </div>
        )}
      </Card>

      {/* TEAM CREW */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-campus-border">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-campus-primary" />
              <span>Project Crew ({team.members?.length || 0})</span>
            </h2>
            <p className="text-xs text-slate-400">Teammates collaborating on this project and what they focus on</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.members?.map((mem) => {
            const isMemLeader = mem.user_id === team.leader_id;

            return (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-campus-border flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300 shrink-0">
                    {mem.user?.full_name?.[0] || 'M'}
                  </div>
                  <div>
                    <Link
                      to={`/students/${mem.user_id}`}
                      className="font-bold text-sm text-white hover:text-campus-primary transition-colors line-clamp-1"
                    >
                      {mem.user?.full_name || 'Member'}
                    </Link>
                    <p className="text-xs text-indigo-400 font-medium line-clamp-1">
                      {mem.role}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Joined {new Date(mem.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isLeader && !isMemLeader && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingMember(mem);
                        setNewRoleTitle(mem.role);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit role title"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(mem.user_id, mem.user?.full_name || 'Member')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* TEAM LEADER SECTION: PENDING APPLICATIONS */}
      {isLeader && (
        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-campus-border">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Pending Join Applications ({joinRequests.length})</span>
              </h2>
              <p className="text-xs text-slate-400">Review student applicants and evaluate fit</p>
            </div>
          </div>

          {joinRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No pending applications for this team right now.
            </p>
          ) : (
            <div className="space-y-3">
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-900 border border-campus-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/students/${req.applicant_id}`}
                        className="font-bold text-sm text-white hover:text-campus-primary"
                      >
                        {req.applicant?.full_name}
                      </Link>
                      <span className="text-[11px] text-indigo-400">
                        ({req.applicant?.title || 'Student'})
                      </span>
                    </div>
                    {req.message && (
                      <p className="text-xs text-slate-300 italic">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Applied {new Date(req.created_at).toLocaleDateString()} &bull; {req.applicant?.school}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptApplication(req.id)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeclineApplication(req.id)}
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* MODAL: APPLY TO JOIN TEAM */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply to Join Team"
        description={`Send an application note to ${team.leader?.full_name || 'the team leader'}.`}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Introduction & Role Pitch (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Explain how your skills and schedule align with this project..."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-campus-border p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmittingApplication}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INVITE CONNECTED STUDENT */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Connected Student"
        description="Invite peers from your campus connections directly to this project team."
      >
        <form onSubmit={handleInviteStudent} className="space-y-4">
          {connections.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              You do not have any connected students outside this team yet. Connect with classmates in{' '}
              <Link to="/students" className="text-campus-primary underline">
                Form Teams
              </Link>{' '}
              first.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Connection
                </label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-campus-border py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  required
                >
                  <option value="">-- Choose student --</option>
                  {connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.full_name} ({conn.title || conn.school})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Assigned Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Research Lead"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-campus-border py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isInviting}
                  disabled={!selectedConnectionId}
                >
                  Send Invitation
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* MODAL: EDIT MEMBER ROLE */}
      <Modal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title="Update Member Role"
        description={`Set a new role title for ${editingMember?.user?.full_name}.`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <Input
            label="Role Title"
            value={newRoleTitle}
            onChange={(e) => setNewRoleTitle(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingMember(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
