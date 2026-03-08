
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '📌',
  lob_id UUID REFERENCES public.lobs(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: create notification when someone RSVPs to a lob you created
CREATE OR REPLACE FUNCTION public.notify_on_lob_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lob_creator UUID;
  lob_title TEXT;
  resp_name TEXT;
  resp_emoji TEXT;
BEGIN
  -- Get lob creator and title
  SELECT created_by, title INTO lob_creator, lob_title
  FROM public.lobs WHERE id = NEW.lob_id;

  -- Don't notify yourself
  IF lob_creator = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get responder name
  SELECT name, avatar INTO resp_name, resp_emoji
  FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, emoji, lob_id)
  VALUES (
    lob_creator,
    'response',
    resp_name || CASE
      WHEN NEW.response = 'in' THEN ' is in!'
      WHEN NEW.response = 'out' THEN ' is out'
      ELSE ' said maybe'
    END,
    lob_title,
    COALESCE(resp_emoji, '👤'),
    NEW.lob_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lob_response_notify
  AFTER INSERT ON public.lob_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_lob_response();

-- Trigger: notify group members when a new lob is created
CREATE OR REPLACE FUNCTION public.notify_on_new_lob()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  creator_emoji TEXT;
  member RECORD;
BEGIN
  SELECT name, avatar INTO creator_name, creator_emoji
  FROM public.profiles WHERE id = NEW.created_by;

  -- Notify all group members except the creator
  IF NEW.group_id IS NOT NULL THEN
    FOR member IN
      SELECT user_id FROM public.group_members WHERE group_id = NEW.group_id AND user_id != NEW.created_by
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, emoji, lob_id)
      VALUES (
        member.user_id,
        'new_lob',
        'New lob from ' || COALESCE(creator_name, 'someone'),
        NEW.title,
        COALESCE(creator_emoji, '🙂'),
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_lob_notify
  AFTER INSERT ON public.lobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_lob();
