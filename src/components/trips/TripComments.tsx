import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { TripComment } from '@/hooks/useTripDetail';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  tripId: string;
  userId: string;
  comments: TripComment[];
}

export function TripComments({ tripId, userId, comments }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialMount = useRef(true);

  const prevCount = useRef(comments.length);

  useEffect(() => {
    // Only auto-scroll when a NEW comment is added after mount, not on initial load
    if (prevCount.current > 0 && comments.length > prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCount.current = comments.length;
  }, [comments.length]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('trip_comments').insert({
        trip_id: tripId,
        user_id: userId,
        message: message.trim(),
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['trip-comments', tripId] });
      setMessage('');
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
      <h2 className="text-sm font-bold text-foreground mb-3">Discussion</h2>

      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 mb-3">No messages yet — start the conversation</p>
      ) : (
        <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <span className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-sm">
                {c.userAvatar}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-foreground">{c.userName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5">{c.message}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Say something..."
          className="flex-1 p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </motion.section>
  );
}
