
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '🙂',
  interests TEXT[] NOT NULL DEFAULT '{}',
  city TEXT,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📌',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups viewable by members" ON public.groups FOR SELECT USING (true);

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members viewable by all" ON public.group_members FOR SELECT USING (true);

-- Lobs table
CREATE TABLE public.lobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  group_id UUID REFERENCES public.groups(id),
  group_name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  location TEXT,
  description TEXT,
  selected_time TIMESTAMPTZ,
  quorum INT NOT NULL DEFAULT 2,
  capacity INT,
  deadline TIMESTAMPTZ,
  recurrence TEXT,
  when_mode TEXT NOT NULL DEFAULT 'flexible',
  flexible_window TEXT,
  status TEXT NOT NULL DEFAULT 'voting',
  -- Open Invite fields
  open_invite_enabled BOOLEAN NOT NULL DEFAULT false,
  open_invite_max_guests INT NOT NULL DEFAULT 0,
  open_invite_used_guests INT NOT NULL DEFAULT 0,
  -- Fill a Seat fields
  fill_a_seat_active BOOLEAN NOT NULL DEFAULT false,
  fill_a_seat_spots INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lobs viewable by all authenticated" ON public.lobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create lobs" ON public.lobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own lobs" ON public.lobs FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Lob time options
CREATE TABLE public.lob_time_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lob_id UUID NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  datetime TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lob_time_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Time options viewable" ON public.lob_time_options FOR SELECT USING (true);

-- Lob time votes
CREATE TABLE public.lob_time_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_option_id UUID NOT NULL REFERENCES public.lob_time_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(time_option_id, user_id)
);
ALTER TABLE public.lob_time_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable" ON public.lob_time_votes FOR SELECT USING (true);

-- Lob responses
CREATE TABLE public.lob_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lob_id UUID NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lob_id, user_id)
);
ALTER TABLE public.lob_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Responses viewable" ON public.lob_responses FOR SELECT USING (true);

-- Lob comments
CREATE TABLE public.lob_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lob_id UUID NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  suggested_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lob_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable" ON public.lob_comments FOR SELECT USING (true);

-- Guest invites for Open Invite feature
CREATE TABLE public.lob_guest_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lob_id UUID NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lob_id, invited_user_id)
);
ALTER TABLE public.lob_guest_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guest invites viewable by authenticated" ON public.lob_guest_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Confirmed attendees can invite guests" ON public.lob_guest_invites FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Creator can update guest invites" ON public.lob_guest_invites FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lobs WHERE id = lob_id AND created_by = auth.uid())
);

-- Fill a Seat requests
CREATE TABLE public.fill_a_seat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lob_id UUID NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lob_id, requester_id)
);
ALTER TABLE public.fill_a_seat_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests viewable by creator and requester" ON public.fill_a_seat_requests FOR SELECT TO authenticated USING (
  requester_id = auth.uid() OR EXISTS (SELECT 1 FROM public.lobs WHERE id = lob_id AND created_by = auth.uid())
);
CREATE POLICY "Users can request seats" ON public.fill_a_seat_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Creators can update requests" ON public.fill_a_seat_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lobs WHERE id = lob_id AND created_by = auth.uid())
);
