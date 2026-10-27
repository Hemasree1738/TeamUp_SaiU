export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectType = 'hackathon' | 'research' | 'competition' | 'personal_project';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type RecruitingStatus = 'open' | 'closed';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type SkillCategory = 'technical' | 'soft';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  title: string;
  school: string;
  degree?: string | null;
  year_of_study: string;
  bio?: string | null;
  project_interests: string[];
  availability: string;
  gender?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  leetcode_url?: string | null;
  hackerrank_url?: string | null;
  kaggle_url?: string | null;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  created_at: string;
}

export interface ProfileSkill {
  profile_id: string;
  skill_id: string;
  skill?: Skill;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  project_objective: string;
  project_type: ProjectType;
  leader_id: string;
  recruiting_status: RecruitingStatus;
  max_capacity: number;
  deadline?: string | null;
  commitment?: string | null;
  logo_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  project_url?: string | null;
  open_roles: string[];
  required_skills: string[];
  created_at: string;
  updated_at: string;
  leader?: Profile;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: Profile;
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  applicant_id: string;
  message?: string | null;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  team?: Team;
  applicant?: Profile;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  role: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  team?: Team;
  inviter?: Profile;
  invitee?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  members?: ConversationMember[];
  last_message?: Message;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string | null;
  reported_team_id?: string | null;
  reported_message_id?: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
}
