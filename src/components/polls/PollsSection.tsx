import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, Trash2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  label: string;
  order_index: number;
  votes: string[];
}

interface Poll {
  id: string;
  created_by: string;
  question: string;
  created_at: string;
  options: PollOption[];
}

interface PollsSectionProps {
  lobId?: string;
  tripId?: string;
  userId: string;
}

function usePollsQuery(lobId?: string, tripId?: string) {
  const queryKey = lobId ? ['polls', 'lob', lobId] : ['polls', 'trip', tripId];
  return useQuery({
    queryKey,
    enabled: !!(lobId || tripId),
    queryFn: async () => {
      const sb = supabase as any;
      const col = lobId ? 'lob_id' : 'trip_id';
      const val = lobId || tripId;
      const { data: polls, error } = await sb
        .from('polls')
        .select('id, created_by, question, created_at')
        .eq(col, val)
        .order('created_at', { ascending: true });
      if (error) {
        if (error.code === '42P01') return [] as Poll[];
        throw error;
      }
      if (!polls?.length) return [] as Poll[];

      const pollIds = polls.map((p: any) => p.id);
      const { data: options } = await sb
        .from('poll_options')
        .select('id, poll_id, label, order_index')
        .in('poll_id', pollIds)
        .order('order_index', { ascending: true });

      const optionIds = (options || []).map((o: any) => o.id);
      const { data: votes } = optionIds.length > 0
        ? await sb.from('poll_votes').select('poll_option_id, user_id').in('poll_option_id', optionIds)
        : { data: [] };

      const votesMap: Record<string, string[]> = {};
      (votes || []).forEach((v: any) => {
        if (!votesMap[v.poll_option_id]) votesMap[v.poll_option_id] = [];
        votesMap[v.poll_option_id].push(v.user_id);
      });

      return polls.map((p: any) => ({
        id: p.id,
        created_by: p.created_by,
        question: p.question,
        created_at: p.created_at,
        options: (options || [])
          .filter((o: any) => o.poll_id === p.id)
          .map((o: any) => ({
            id: o.id,
            label: o.label,
            order_index: o.order_index,
            votes: votesMap[o.id] || [],
          })),
      })) as Poll[];
    },
    staleTime: 15_000,
  });
}

/** Tracks visualViewport height so the sheet content can pad above the keyboard */
function useViewportHeight() {
  const [extraBottom, setExtraBottom] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // How much the viewport has shrunk from the full window height = keyboard height
      const shrink = window.innerHeight - vv.height - vv.offsetTop;
      setExtraBottom(Math.max(0, shrink));
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return extraBottom;
}

export function PollsSection({ lobId, tripId, userId }: PollsSectionProps) {
  const queryClient = useQueryClient();
  const queryKey = lobId ? ['polls', 'lob', lobId] : ['polls', 'trip', tripId];
  const { data: polls = [] } = usePollsQuery(lobId, tripId);

  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);
  const extraBottom = useViewportHeight();

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleVote = async (poll: Poll, optionId: string) => {
    const sb = supabase as any;
    const currentVoteOptionId = poll.options.find(o => o.votes.includes(userId))?.id;
    if (currentVoteOptionId === optionId) {
      await sb.from('poll_votes').delete().eq('poll_option_id', optionId).eq('user_id', userId);
    } else {
      if (currentVoteOptionId) {
        await sb.from('poll_votes').delete().eq('poll_option_id', currentVoteOptionId).eq('user_id', userId);
      }
      await sb.from('poll_votes').insert({ poll_option_id: optionId, user_id: userId });
    }
    invalidate();
  };

  const handleDelete = async (pollId: string) => {
    await (supabase as any).from('polls').delete().eq('id', pollId);
    invalidate();
    toast.success('Poll deleted');
  };

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      toast.error('Add a question and at least 2 options');
      return;
    }
    setSaving(true);
    try {
      const sb = supabase as any;
      const pollData: any = { created_by: userId, question: question.trim() };
      if (lobId) pollData.lob_id = lobId;
      if (tripId) pollData.trip_id = tripId;

      const { data: poll, error } = await sb.from('polls').insert(pollData).select('id').single();
      if (error) throw error;

      await sb.from('poll_options').insert(
        validOptions.map((label, i) => ({ poll_id: poll.id, label: label.trim(), order_index: i }))
      );

      setQuestion('');
      setOptions(['', '']);
      setShowCreate(false);
      invalidate();
      toast.success('Poll created!');
    } catch {
      toast.error('Failed to create poll — make sure polls tables exist in Supabase');
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions(prev => [...prev, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const dismissKeyboard = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Polls</h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-xs font-semibold text-primary cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> Create Poll
        </button>
      </div>

      {polls.length === 0 && !showCreate && (
        <p className="text-xs text-muted-foreground/60 py-2">No polls yet — ask the group a question</p>
      )}

      <div className="space-y-3">
        {polls.map(poll => {
          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
          const myVoteOptionId = poll.options.find(o => o.votes.includes(userId))?.id;
          return (
            <div key={poll.id} className="gradient-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-bold text-foreground">{poll.question}</p>
                {poll.created_by === userId && (
                  <button
                    onClick={() => handleDelete(poll.id)}
                    className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 ml-2 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {poll.options.map(opt => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                  const isVoted = myVoteOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(poll, opt.id)}
                      className={`w-full text-left rounded-xl overflow-hidden border transition-all cursor-pointer active:scale-[0.98] ${isVoted ? 'border-primary/40' : 'border-border'}`}
                    >
                      <div className="relative px-3 py-2.5">
                        <div
                          className={`absolute inset-y-0 left-0 transition-all rounded-xl ${isVoted ? 'bg-primary/15' : 'bg-secondary/60'}`}
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center justify-between">
                          <span className={`text-sm font-medium ${isVoted ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">{opt.votes.length}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>

      {/* Create Poll Sheet */}
      <AnimatePresence>
        {showCreate && (
          <>
            {/* Backdrop — tapping it dismisses keyboard first, then sheet */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { dismissKeyboard(); setShowCreate(false); }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
              style={{ paddingBottom: extraBottom }}
            >
              <div className="bg-card rounded-t-3xl border border-border/50 shadow-card flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-5 pt-4 pb-2 shrink-0">
                  <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-foreground">📊 Create Poll</h2>
                    <button
                      onClick={() => { dismissKeyboard(); setShowCreate(false); }}
                      className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Scrollable content — tapping empty area dismisses keyboard */}
                <div
                  className="flex-1 overflow-y-auto px-4 pt-4"
                  onClick={e => { if (e.target === e.currentTarget) dismissKeyboard(); }}
                >
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Question</label>
                    <input
                      type="text"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      placeholder="Ask the group something..."
                      className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="mb-6">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Options</label>
                    <div className="space-y-2">
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={e => setOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {options.length > 2 && (
                            <button onClick={() => removeOption(i)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center cursor-pointer shrink-0">
                              <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {options.length < 8 && (
                      <button
                        onClick={addOption}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add option
                      </button>
                    )}
                  </div>
                </div>

                {/* Pinned footer — always visible above keyboard */}
                <div
                  className="shrink-0 p-4 border-t border-white/10 bg-card"
                  style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
                >
                  <button
                    onClick={handleCreate}
                    disabled={saving || !question.trim() || options.filter(o => o.trim()).length < 2}
                    className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {saving ? 'Creating...' : 'Create Poll'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
