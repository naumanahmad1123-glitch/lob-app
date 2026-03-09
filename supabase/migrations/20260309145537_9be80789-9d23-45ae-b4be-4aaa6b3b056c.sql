
-- Create lob_recipients table for individual lob targeting
CREATE TABLE public.lob_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lob_id UUID NOT NULL REFERENCES public.lobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lob_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lob_recipients ENABLE ROW LEVEL SECURITY;

-- Recipients and lob creators can view
CREATE POLICY "Recipients viewable by involved users"
  ON public.lob_recipients
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.lobs WHERE lobs.id = lob_recipients.lob_id AND lobs.created_by = auth.uid())
  );

-- Lob creators can insert recipients
CREATE POLICY "Creators can add recipients"
  ON public.lob_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.lobs WHERE lobs.id = lob_recipients.lob_id AND lobs.created_by = auth.uid())
  );

-- Lob creators can delete recipients
CREATE POLICY "Creators can remove recipients"
  ON public.lob_recipients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.lobs WHERE lobs.id = lob_recipients.lob_id AND lobs.created_by = auth.uid())
  );

-- Update notify_on_new_lob to also notify individual recipients
CREATE OR REPLACE FUNCTION public.notify_on_new_lob()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  creator_name TEXT;
  creator_emoji TEXT;
  member RECORD;
  recipient RECORD;
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

  -- Notify individual recipients
  FOR recipient IN
    SELECT user_id FROM public.lob_recipients WHERE lob_id = NEW.id AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, emoji, lob_id)
    VALUES (
      recipient.user_id,
      'new_lob',
      COALESCE(creator_name, 'Someone') || ' lobbed you',
      NEW.title,
      COALESCE(creator_emoji, '🙂'),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Enable realtime for lob_recipients
ALTER PUBLICATION supabase_realtime ADD TABLE public.lob_recipients;
