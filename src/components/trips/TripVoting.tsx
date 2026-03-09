import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Lightbulb, Plus, ThumbsUp, Lock, X } from 'lucide-react';
import { TripSuggestion } from '@/hooks/useTripDetail';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  tripId: string;
  userId: string;
  isOwner: boolean;
  status: string;
  suggestions: TripSuggestion[];
  hasDestination: boolean;
  hasDates: boolean;
}

function SuggestionCard({
  s,
  userId,
  isOwner,
  tripId,
  type,
}: {
  s: TripSuggestion;
  userId: string;
  isOwner: boolean;
  tripId: string;
  type: string;
}) {
  const queryClient = useQueryClient();
  const hasVoted = s.votes.includes(userId);
  const [locking, setLocking] = useState(false);

  const toggleVote = async () => {
    if (hasVoted) {
      await supabase.from('trip_votes').delete().eq('suggestion_id', s.id).eq('user_id', userId);
    } else {
      await supabase.from('trip_votes').insert({ suggestion_id: s.id, user_id: userId });
    }
    queryClient.invalidateQueries({ queryKey: ['trip-suggestions', tripId] });
  };

  const lockIn = async () => {
    if (!isOwner || locking) return;
    setLocking(true);
    try {
      if (type === 'destination') {
        await supabase.from('trips').update({ city: s.content, status: 'confirmed' }).eq('id', tripId);
        queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      }
      toast.success('Locked in!');
    } catch {
      toast.error('Failed to lock in');
    } finally {
      setLocking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
    >
      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
        {s.userAvatar}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{s.content}</p>
        <p className="text-[11px] text-muted-foreground">{s.userName}</p>
      </div>
      <button
        onClick={toggleVote}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${
          hasVoted
            ? 'bg-primary/15 text-primary'
            : 'bg-secondary text-muted-foreground hover:text-foreground'
        }`}
      >
        <ThumbsUp className="w-3 h-3" />
        {s.votes.length}
      </button>
      {isOwner && type === 'destination' && (
        <button
          onClick={lockIn}
          disabled={locking}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-accent/10 text-accent cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Lock className="w-3 h-3" /> Lock In
        </button>
      )}
    </motion.div>
  );
}

export function TripVoting({ tripId, userId, isOwner, status, suggestions, hasDestination, hasDates }: Props) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState<string | null>(null); // 'destination' | 'date' | 'activity'
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);

  const destSuggestions = suggestions
    .filter(s => s.type === 'destination')
    .sort((a, b) => b.votes.length - a.votes.length);
  const dateSuggestions = suggestions
    .filter(s => s.type === 'date')
    .sort((a, b) => b.votes.length - a.votes.length);
  const activitySuggestions = suggestions
    .filter(s => s.type === 'activity')
    .sort((a, b) => b.votes.length - a.votes.length);

  const handleAdd = async () => {
    if (!inputVal.trim() || !adding || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('trip_suggestions').insert({
        trip_id: tripId,
        user_id: userId,
        type: adding,
        content: inputVal.trim(),
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['trip-suggestions', tripId] });
      setInputVal('');
      setAdding(null);
      toast.success('Suggestion added!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { key: 'destination', label: 'Destinations', icon: MapPin, items: destSuggestions, show: !hasDestination },
    { key: 'date', label: 'Date Options', icon: Calendar, items: dateSuggestions, show: !hasDates },
    { key: 'activity', label: 'Activities & Ideas', icon: Lightbulb, items: activitySuggestions, show: true },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
      <h2 className="text-sm font-bold text-foreground mb-3">Collaborative Planning</h2>

      {hasDestination && hasDates && (
        <p className="text-xs text-accent font-medium mb-3">Destination and dates are locked in ✓</p>
      )}

      {sections.filter(s => s.show).map(section => (
        <div key={section.key} className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <section.icon className="w-3.5 h-3.5" />
              {section.label}
            </div>
            <button
              onClick={() => setAdding(adding === section.key ? null : section.key)}
              className="flex items-center gap-1 text-[11px] font-medium text-primary cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" /> Suggest
            </button>
          </div>

          <AnimatePresence>
            {adding === section.key && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder={
                      section.key === 'destination' ? 'e.g. Barcelona 🇪🇸' :
                      section.key === 'date' ? 'e.g. Aug 15–22' :
                      'e.g. Day trip to Teotihuacan'
                    }
                    className="flex-1 p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={handleAdd}
                    disabled={saving || !inputVal.trim()}
                    className="px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {saving ? '...' : 'Add'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {section.items.length > 0 ? (
            <div className="space-y-2">
              {section.items.map(s => (
                <SuggestionCard key={s.id} s={s} userId={userId} isOwner={isOwner} tripId={tripId} type={section.key} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 py-2">No suggestions yet</p>
          )}
        </div>
      ))}
    </motion.section>
  );
}
