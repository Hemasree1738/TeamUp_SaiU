import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Team, TeamMember, TeamJoinRequest, TeamInvitation, ProjectType, RecruitingStatus, Profile } from '../types/database.types';

export interface TeamFilters {
  search?: string;
  projectType?: ProjectType | 'all';
  recruitingStatus?: RecruitingStatus | 'all';
  skill?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}

export const teamService = {
  async getTeams(filters: TeamFilters): Promise<{ teams: (Team & { leader: Profile; membersCount: number })[]; total: number }> {
    if (!isSupabaseConfigured) return { teams: [], total: 0 };

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 12;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('teams')
      .select('*, leader:profiles!leader_id(*), members:team_members(id)', { count: 'exact' });

    if (filters.projectType && filters.projectType !== 'all') {
      query = query.eq('project_type', filters.projectType);
    }

    if (filters.recruitingStatus && filters.recruitingStatus !== 'all') {
      query = query.eq('recruiting_status', filters.recruitingStatus);
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},project_objective.ilike.${term}`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    let result = (data || []).map((t: any) => ({
      ...t,
      membersCount: t.members?.length || 0,
    }));

    if (filters.skill && filters.skill.trim() !== '') {
      const s = filters.skill.toLowerCase();
      result = result.filter((t: any) =>
        t.required_skills?.some((req: string) => req.toLowerCase().includes(s))
      );
    }

    if (filters.role && filters.role.trim() !== '') {
      const r = filters.role.toLowerCase();
      result = result.filter((t: any) =>
        t.open_roles?.some((role: string) => role.toLowerCase().includes(r))
      );
    }

    return {
      teams: result,
      total: count || 0,
    };
  },

  async getTeamById(teamId: string): Promise<(Team & { leader: Profile; members: (TeamMember & { user: Profile })[] }) | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('teams')
      .select('*, leader:profiles!leader_id(*), members:team_members(*, user:profiles(*))')
      .eq('id', teamId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createTeam(
    leaderId: string,
    teamData: Omit<Team, 'id' | 'leader_id' | 'created_at' | 'updated_at' | 'leader' | 'members'>
  ): Promise<Team> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. Insert team
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({
        ...teamData,
        leader_id: leaderId,
      })
      .select()
      .single();

    if (teamErr) throw teamErr;

    // 2. Add leader as first member
    const { error: memErr } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: leaderId,
      role: 'Team Leader',
    });

    if (memErr) {
      console.error('Failed to add leader to team_members:', memErr);
    }

    return team;
  },

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('teams')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTeam(teamId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) throw error;
  },

  async getUserTeams(userId: string): Promise<{ ledTeams: Team[]; memberTeams: Team[] }> {
    if (!isSupabaseConfigured) return { ledTeams: [], memberTeams: [] };

    const { data: led, error: ledErr } = await supabase
      .from('teams')
      .select('*, leader:profiles!leader_id(*)')
      .eq('leader_id', userId)
      .order('created_at', { ascending: false });

    if (ledErr) throw ledErr;

    const { data: memberRows, error: memErr } = await supabase
      .from('team_members')
      .select('team:teams(*, leader:profiles!leader_id(*))')
      .eq('user_id', userId);

    if (memErr) throw memErr;

    const memberTeams = (memberRows || [])
      .map((r: any) => r.team)
      .filter((t: any) => t && t.leader_id !== userId);

    return {
      ledTeams: led || [],
      memberTeams: memberTeams || [],
    };
  },

  async submitJoinRequest(teamId: string, applicantId: string, message: string): Promise<TeamJoinRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // Check if already applied
    const { data: existing } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('team_id', teamId)
      .eq('applicant_id', applicantId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      throw new Error('You already have a pending join request for this team.');
    }

    // Check if already a member
    const { data: isMem } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', applicantId)
      .maybeSingle();

    if (isMem) {
      throw new Error('You are already a member of this team.');
    }

    const { data, error } = await supabase
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        applicant_id: applicantId,
        message,
        status: 'pending',
      })
      .select('*, team:teams(*)')
      .single();

    if (error) throw error;

    // Send notification to team leader
    if (data.team?.leader_id) {
      await supabase.from('notifications').insert({
        user_id: data.team.leader_id,
        actor_id: applicantId,
        type: 'team_join_request',
        title: 'New Team Application',
        message: `A student applied to join ${data.team.name}`,
        link: `/teams/${teamId}`,
      });
    }

    return data;
  },

  async cancelJoinRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('team_join_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
  },

  async getTeamJoinRequests(teamId: string): Promise<(TeamJoinRequest & { applicant: Profile })[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('team_join_requests')
      .select('*, applicant:profiles(*)')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async getUserJoinRequests(userId: string): Promise<(TeamJoinRequest & { team: Team })[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('team_join_requests')
      .select('*, team:teams(*)')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async acceptJoinRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: res, error: rpcErr } = await supabase.rpc('accept_team_join_request', {
      req_id: requestId,
    });

    if (rpcErr || (res && !res.success)) {
      throw new Error(rpcErr?.message || res?.error || 'Failed to accept join request.');
    }
  },

  async declineJoinRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: req, error } = await supabase
      .from('team_join_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('applicant_id, team:teams(name)')
      .single();

    if (error) throw error;

    if (req?.applicant_id) {
      await supabase.from('notifications').insert({
        user_id: req.applicant_id,
        type: 'team_join_declined',
        title: 'Application Update',
        message: `Your application to join ${(req.team as any)?.name || 'the team'} was declined.`,
      });
    }
  },

  async inviteStudent(teamId: string, inviterId: string, inviteeId: string, role: string): Promise<TeamInvitation> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        role,
        status: 'pending',
      })
      .select('*, team:teams(*)')
      .single();

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: inviteeId,
      actor_id: inviterId,
      type: 'team_invite',
      title: 'Team Invitation',
      message: `You have been invited to join ${data.team?.name || 'a team'} as ${role}`,
      link: `/teams/${teamId}`,
    });

    return data;
  },

  async getUserInvitations(userId: string): Promise<(TeamInvitation & { team: Team; inviter: Profile })[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, team:teams(*), inviter:profiles!inviter_id(*)')
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async acceptInvitation(invitationId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: res, error: rpcErr } = await supabase.rpc('accept_team_invitation', {
      inv_id: invitationId,
    });

    if (rpcErr || (res && !res.success)) {
      throw new Error(rpcErr?.message || res?.error || 'Failed to accept invitation.');
    }
  },

  async declineInvitation(invitationId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) throw error;
  },

  async removeMember(teamId: string, memberUserId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', memberUserId);

    if (error) throw error;
  },

  async updateMemberRole(teamId: string, memberUserId: string, newRole: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', memberUserId);

    if (error) throw error;
  },
};
