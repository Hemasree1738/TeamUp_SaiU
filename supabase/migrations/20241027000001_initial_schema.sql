-- ============================================================================
-- TeamUp Campus - Database Migration: 001 Initial Schema & RLS Policies
-- Description: Complete normalized schema for student discovery, team collaboration,
--              messaging, connections, moderation and notifications with Row Level Security.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- References auth.users(id). Populated automatically via trigger on signup.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    title TEXT DEFAULT '',
    school TEXT NOT NULL DEFAULT 'School of Computing & Data Science',
    degree TEXT DEFAULT '',
    year_of_study TEXT DEFAULT '1st Year',
    bio TEXT DEFAULT '',
    project_interests TEXT[] DEFAULT '{}',
    availability TEXT DEFAULT 'Flexible',
    gender TEXT DEFAULT 'Prefer not to say',
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    leetcode_url TEXT,
    hackerrank_url TEXT,
    kaggle_url TEXT,
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching and filtering profiles
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school);
CREATE INDEX IF NOT EXISTS idx_profiles_year ON public.profiles(year_of_study);
CREATE INDEX IF NOT EXISTS idx_profiles_is_onboarded ON public.profiles(is_onboarded);

-- 2. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'soft')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILE_SKILLS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.profile_skills (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_skills_skill ON public.profile_skills(skill_id);

-- 4. CONNECTION_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT sender_not_receiver CHECK (sender_id != receiver_id)
);

-- Prevent duplicate active pending requests between same pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_connection 
ON public.connection_requests(sender_id, receiver_id) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_sender ON public.connection_requests(sender_id, status);

-- 5. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    project_objective TEXT NOT NULL,
    project_type TEXT NOT NULL CHECK (project_type IN ('hackathon', 'research', 'competition', 'personal_project')),
    leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recruiting_status TEXT NOT NULL CHECK (recruiting_status IN ('open', 'closed')) DEFAULT 'open',
    max_capacity INT NOT NULL DEFAULT 5 CHECK (max_capacity >= 2 AND max_capacity <= 20),
    deadline DATE,
    commitment TEXT DEFAULT 'Flexible (5-10 hrs/week)',
    logo_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    project_url TEXT,
    open_roles TEXT[] DEFAULT '{}',
    required_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_project_type ON public.teams(project_type);
CREATE INDEX IF NOT EXISTS idx_teams_recruiting ON public.teams(recruiting_status);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON public.teams(leader_id);

-- 6. TEAM_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);

-- 7. TEAM_JOIN_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_join_req 
ON public.team_join_requests(team_id, applicant_id) 
WHERE status = 'pending';

-- 8. TEAM_INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member',
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_invite 
ON public.team_invitations(team_id, invitee_id) 
WHERE status = 'pending';

-- 9. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CONVERSATION_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);

-- 11. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- 12. BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CONSTRAINT blocker_not_blocked CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

-- 13. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    reported_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- ============================================================================
-- PRE-POPULATE SKILLS CATALOGUE
-- ============================================================================
INSERT INTO public.skills (name, category) VALUES
    ('Python', 'technical'),
    ('Java', 'technical'),
    ('JavaScript', 'technical'),
    ('TypeScript', 'technical'),
    ('C', 'technical'),
    ('C++', 'technical'),
    ('C#', 'technical'),
    ('Go', 'technical'),
    ('Rust', 'technical'),
    ('SQL', 'technical'),
    ('PostgreSQL', 'technical'),
    ('MongoDB', 'technical'),
    ('HTML', 'technical'),
    ('CSS', 'technical'),
    ('Tailwind CSS', 'technical'),
    ('React', 'technical'),
    ('Next.js', 'technical'),
    ('Node.js', 'technical'),
    ('Express', 'technical'),
    ('Django', 'technical'),
    ('FastAPI', 'technical'),
    ('Machine Learning', 'technical'),
    ('Deep Learning', 'technical'),
    ('Data Science', 'technical'),
    ('Natural Language Processing', 'technical'),
    ('Computer Vision', 'technical'),
    ('PyTorch', 'technical'),
    ('TensorFlow', 'technical'),
    ('Cloud Computing', 'technical'),
    ('AWS', 'technical'),
    ('Azure', 'technical'),
    ('GCP', 'technical'),
    ('Docker', 'technical'),
    ('Kubernetes', 'technical'),
    ('DevOps', 'technical'),
    ('CI/CD', 'technical'),
    ('Cybersecurity', 'technical'),
    ('Networking', 'technical'),
    ('UI/UX Design', 'technical'),
    ('Figma', 'technical'),
    ('Communication', 'soft'),
    ('Leadership', 'soft'),
    ('Teamwork', 'soft'),
    ('Research', 'soft'),
    ('Project Management', 'soft'),
    ('Presentation', 'soft'),
    ('Problem Solving', 'soft'),
    ('Time Management', 'soft'),
    ('Critical Thinking', 'soft'),
    ('Adaptability', 'soft')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- AUTH TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Anyone authenticated can view onboarded profiles (except if blocked)
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- Can view own profile, or view any onboarded profile if not blocked
    id = auth.uid() OR (
        is_onboarded = TRUE AND NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = auth.uid() AND blocked_id = profiles.id)
               OR (blocker_id = profiles.id AND blocked_id = auth.uid())
        )
    )
);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. SKILLS POLICIES
CREATE POLICY "Skills viewable by authenticated users"
ON public.skills FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to add new custom skills if not present
CREATE POLICY "Users can insert skills"
ON public.skills FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. PROFILE_SKILLS POLICIES
CREATE POLICY "Profile skills viewable by authenticated"
ON public.profile_skills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage own profile skills"
ON public.profile_skills FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own profile skills"
ON public.profile_skills FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- 4. CONNECTION_REQUESTS POLICIES
CREATE POLICY "View connection requests involving user"
ON public.connection_requests FOR SELECT
TO authenticated
USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = (CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END))
           OR (blocker_id = (CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END) AND blocked_id = auth.uid())
    )
);

CREATE POLICY "Sender can create connection request"
ON public.connection_requests FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND sender_id != receiver_id
    AND NOT EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = auth.uid() AND blocked_id = receiver_id)
           OR (blocker_id = receiver_id AND blocked_id = auth.uid())
    )
);

-- Sender can cancel; receiver can accept or decline
CREATE POLICY "Users can update their relevant connection requests"
ON public.connection_requests FOR UPDATE
TO authenticated
USING (
    (sender_id = auth.uid() AND status = 'pending') -- Sender cancelling
    OR (receiver_id = auth.uid() AND status = 'pending') -- Receiver responding
)
WITH CHECK (
    (sender_id = auth.uid() AND status = 'cancelled')
    OR (receiver_id = auth.uid() AND status IN ('accepted', 'declined'))
);

-- 5. TEAMS POLICIES
CREATE POLICY "Teams viewable by authenticated users"
ON public.teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (leader_id = auth.uid());

CREATE POLICY "Team leader can update team"
ON public.teams FOR UPDATE
TO authenticated
USING (leader_id = auth.uid())
WITH CHECK (leader_id = auth.uid());

CREATE POLICY "Team leader can delete team"
ON public.teams FOR DELETE
TO authenticated
USING (leader_id = auth.uid());

-- 6. TEAM_MEMBERS POLICIES
CREATE POLICY "Team members viewable by authenticated"
ON public.team_members FOR SELECT
TO authenticated
USING (true);

-- Team leader can add members or user can insert themselves via join/invite acceptance
CREATE POLICY "Add team member via authorized actions"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Team leader inserting member directly
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid())
    -- Or user adding themselves as creator upon team creation
    OR user_id = auth.uid()
);

CREATE POLICY "Team leader or self can remove member"
ON public.team_members FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() -- Leave team
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid()) -- Leader remove
);

-- 7. TEAM_JOIN_REQUESTS POLICIES
CREATE POLICY "Join requests viewable by applicant or team leader"
ON public.team_join_requests FOR SELECT
TO authenticated
USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_join_requests.team_id AND leader_id = auth.uid())
);

CREATE POLICY "Applicants can insert join requests"
ON public.team_join_requests FOR INSERT
TO authenticated
WITH CHECK (
    applicant_id = auth.uid()
    -- Check that team is open and applicant is not already a member
    AND NOT EXISTS (
        SELECT 1 FROM public.team_members WHERE team_id = team_join_requests.team_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Applicant can cancel or leader can accept/decline join request"
ON public.team_join_requests FOR UPDATE
TO authenticated
USING (
    (applicant_id = auth.uid() AND status = 'pending')
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_join_requests.team_id AND leader_id = auth.uid())
)
WITH CHECK (
    (applicant_id = auth.uid() AND status = 'cancelled')
    OR (
        EXISTS (SELECT 1 FROM public.teams WHERE id = team_join_requests.team_id AND leader_id = auth.uid())
        AND status IN ('accepted', 'declined')
    )
);

-- 8. TEAM_INVITATIONS POLICIES
CREATE POLICY "Invitations viewable by inviter, invitee, or team leader"
ON public.team_invitations FOR SELECT
TO authenticated
USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND leader_id = auth.uid())
);

CREATE POLICY "Team leader can create invitations"
ON public.team_invitations FOR INSERT
TO authenticated
WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND leader_id = auth.uid())
);

CREATE POLICY "Invitee can accept/decline or inviter can cancel"
ON public.team_invitations FOR UPDATE
TO authenticated
USING (
    (invitee_id = auth.uid() AND status = 'pending')
    OR (inviter_id = auth.uid() AND status = 'pending')
)
WITH CHECK (
    (invitee_id = auth.uid() AND status IN ('accepted', 'declined'))
    OR (inviter_id = auth.uid() AND status = 'cancelled')
);

-- 9. CONVERSATIONS & PARTICIPANTS POLICIES
CREATE POLICY "Conversations viewable by members"
ON public.conversations FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Conversation members viewable by conversation members"
ON public.conversation_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members cm 
        WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Add conversation members"
ON public.conversation_members FOR INSERT
TO authenticated
WITH CHECK (
    -- User adding themselves or other user during initial conversation creation
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.conversation_members cm 
        WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Update own conversation member read state"
ON public.conversation_members FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. MESSAGES POLICIES
CREATE POLICY "Messages viewable by conversation members"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Members can send messages if not blocked"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
    -- Verify no blocks exist with the other members in this conversation
    AND NOT EXISTS (
        SELECT 1 FROM public.conversation_members cm
        JOIN public.blocks b ON (b.blocker_id = auth.uid() AND b.blocked_id = cm.user_id)
                             OR (b.blocker_id = cm.user_id AND b.blocked_id = auth.uid())
        WHERE cm.conversation_id = messages.conversation_id AND cm.user_id != auth.uid()
    )
);

-- 11. BLOCKS POLICIES
CREATE POLICY "Users can view their blocks"
ON public.blocks FOR SELECT
TO authenticated
USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks"
ON public.blocks FOR INSERT
TO authenticated
WITH CHECK (blocker_id = auth.uid() AND blocker_id != blocked_id);

CREATE POLICY "Users can delete own blocks (unblock)"
ON public.blocks FOR DELETE
TO authenticated
USING (blocker_id = auth.uid());

-- 12. REPORTS POLICIES
CREATE POLICY "Users can view own filed reports"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- 13. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System and users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- SECURE DATABASE FUNCTIONS FOR TRANSACTIONAL OPERATIONS
-- ============================================================================

-- Function to safely accept team join requests with capacity check & member creation
CREATE OR REPLACE FUNCTION public.accept_team_join_request(req_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_team_id UUID;
    v_applicant_id UUID;
    v_leader_id UUID;
    v_max_capacity INT;
    v_current_count INT;
    v_team_name TEXT;
BEGIN
    -- Retrieve request details
    SELECT tjr.team_id, tjr.applicant_id, t.leader_id, t.max_capacity, t.name
    INTO v_team_id, v_applicant_id, v_leader_id, v_max_capacity, v_team_name
    FROM public.team_join_requests tjr
    JOIN public.teams t ON t.id = tjr.team_id
    WHERE tjr.id = req_id AND tjr.status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or not pending.');
    END IF;

    -- Verify that calling user is the team leader
    IF v_leader_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only team leader can accept requests.');
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_current_count FROM public.team_members WHERE team_id = v_team_id;
    IF v_current_count >= v_max_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team is already at maximum capacity.');
    END IF;

    -- Update request status
    UPDATE public.team_join_requests 
    SET status = 'accepted', updated_at = NOW() 
    WHERE id = req_id;

    -- Insert into team members
    INSERT INTO public.team_members (team_id, user_id, role, joined_at)
    VALUES (v_team_id, v_applicant_id, 'Member', NOW())
    ON CONFLICT (team_id, user_id) DO NOTHING;

    -- Send notification to applicant
    INSERT INTO public.notifications (user_id, actor_id, type, title, message, link)
    VALUES (
        v_applicant_id,
        auth.uid(),
        'team_join_accepted',
        'Application Accepted!',
        'You have been accepted into team ' || v_team_name,
        '/teams/' || v_team_id
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely accept team invitations
CREATE OR REPLACE FUNCTION public.accept_team_invitation(inv_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_team_id UUID;
    v_invitee_id UUID;
    v_role TEXT;
    v_max_capacity INT;
    v_current_count INT;
    v_team_name TEXT;
BEGIN
    SELECT ti.team_id, ti.invitee_id, ti.role, t.max_capacity, t.name
    INTO v_team_id, v_invitee_id, v_role, v_max_capacity, v_team_name
    FROM public.team_invitations ti
    JOIN public.teams t ON t.id = ti.team_id
    WHERE ti.id = inv_id AND ti.status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or not pending.');
    END IF;

    IF v_invitee_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
    END IF;

    SELECT COUNT(*) INTO v_current_count FROM public.team_members WHERE team_id = v_team_id;
    IF v_current_count >= v_max_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team is already at maximum capacity.');
    END IF;

    UPDATE public.team_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = inv_id;

    INSERT INTO public.team_members (team_id, user_id, role, joined_at)
    VALUES (v_team_id, v_invitee_id, COALESCE(v_role, 'Member'), NOW())
    ON CONFLICT (team_id, user_id) DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept connection request & notify sender
CREATE OR REPLACE FUNCTION public.accept_connection_request(req_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_sender_id UUID;
    v_receiver_id UUID;
    v_receiver_name TEXT;
BEGIN
    SELECT cr.sender_id, cr.receiver_id, p.full_name
    INTO v_sender_id, v_receiver_id, v_receiver_name
    FROM public.connection_requests cr
    JOIN public.profiles p ON p.id = cr.receiver_id
    WHERE cr.id = req_id AND cr.status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or not pending.');
    END IF;

    IF v_receiver_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only the recipient can accept.');
    END IF;

    UPDATE public.connection_requests
    SET status = 'accepted', updated_at = NOW()
    WHERE id = req_id;

    -- Notify sender
    INSERT INTO public.notifications (user_id, actor_id, type, title, message, link)
    VALUES (
        v_sender_id,
        auth.uid(),
        'connection_accepted',
        'Connection Accepted',
        COALESCE(v_receiver_name, 'A student') || ' accepted your connection request.',
        '/students/' || v_receiver_id
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
