
-- Add status column to trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planning';

-- Trip members
CREATE TABLE public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trip members viewable by authenticated" ON public.trip_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trip creator can insert members" ON public.trip_members FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_members.trip_id AND user_id = auth.uid())
  OR auth.uid() = trip_members.user_id
);
CREATE POLICY "Trip creator can update members" ON public.trip_members FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_members.trip_id AND user_id = auth.uid())
);
CREATE POLICY "Trip creator can delete members" ON public.trip_members FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_members.trip_id AND user_id = auth.uid())
  OR auth.uid() = trip_members.user_id
);

-- Trip suggestions (destination, date, activity)
CREATE TABLE public.trip_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'activity',
  content text NOT NULL,
  extra jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suggestions viewable by authenticated" ON public.trip_suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert suggestions" ON public.trip_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggestions" ON public.trip_suggestions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trip votes
CREATE TABLE public.trip_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES public.trip_suggestions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);
ALTER TABLE public.trip_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by authenticated" ON public.trip_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert votes" ON public.trip_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.trip_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trip comments
CREATE TABLE public.trip_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by authenticated" ON public.trip_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert comments" ON public.trip_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.trip_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_comments;
