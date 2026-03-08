
-- Create trips table
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '✈️',
  start_date date NOT NULL,
  end_date date NOT NULL,
  notify_user_ids uuid[] NOT NULL DEFAULT '{}',
  show_on_profile boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Trips RLS
CREATE POLICY "Trips viewable by all authenticated" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Users can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- Fix missing INSERT policies
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update groups" ON public.groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can add group members" ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Group creators can update members" ON public.group_members FOR UPDATE USING (true);
CREATE POLICY "Group creators can delete members" ON public.group_members FOR DELETE USING (true);

CREATE POLICY "Users can insert time options" ON public.lob_time_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert time votes" ON public.lob_time_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own time votes" ON public.lob_time_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert responses" ON public.lob_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own responses" ON public.lob_responses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert comments" ON public.lob_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lob_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
