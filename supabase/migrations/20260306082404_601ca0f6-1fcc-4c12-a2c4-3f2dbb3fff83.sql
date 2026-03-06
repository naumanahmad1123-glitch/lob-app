CREATE TABLE public.lob_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lob_id uuid NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  outcome text NOT NULL DEFAULT 'pending',
  bailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lob_id)
);

ALTER TABLE public.lob_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance viewable by all authenticated"
  ON public.lob_attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own attendance"
  ON public.lob_attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON public.lob_attendance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);