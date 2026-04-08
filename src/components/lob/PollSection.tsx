import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Plus, X, Send, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user_ids
}

interface Poll {
  id: string;
  question: string;
  created_by: string;
  options: PollOption[];
}

interface PollSectionProps {
  lobId: string;
  canAddPoll: boolean;
}

function usePollsForLob(lobId: string) {
  return useQuery({
    queryKey: ['polls', lobId],
    queryFn: async () => {
      const { data: polls, error } = await supabase
        .from('polls')
        .select('id, question, created_by')
        .eq('lob_id', lobId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const pollsWithOptions = await Promise.all((polls || []).map(async poll => {
        const { data: options } = await supabase
          .from('poll_options')
          .select('id, text')
          .eq('poll_id', poll.id)
          .order('created_at', { ascending: true });

        const optionsWithVotes = await Promise.all((options || []).map(async opt => {
          const { data: votes } = await supabase
            .from('poll_votes')
            .select('user_id')
            .eq('poll_option_id', opt.id);
          return { ...opt, votes: (votes || []).map(v => v.user_id) };
        }));

        return { ...poll, options: optionsWithVotes };
      }));

      return pollsWithOptions as Poll[];
    },
    staleTime: 10_000,
  });
}

export function PollSection({ lobId, canAddPoll }: PollSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: polls = [] } = usePollsForLob(lobId);

  const [showCreator, setShowCreator] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);

  const addOption = () => { if (options.length < 5) setOptions(p => [...p, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(p => p.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => setOptions(p => p.map((o, idx) => idx === i ? val : o));

  const handleCreate = async () => {
    if (!user || saving) return;
    if (!question.trim()) { toast.error('Add a question'); return; }
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) { toast.error('Add at least 2 options'); return; }
    setSaving(true);
    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .insert({ lob_id: lobId, question: question.trim(), created_by: user.id })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('poll_options').insert(
        validOptions.map(text => ({ poll_id: poll.id, text: text.trim() }))
      );
      queryClient.invalidateQueries({ queryKey: ['polls', lobId] });
      toast.success('Poll added!');
      setShowCreator(false);
      setQuestion('');
      setOptions(['', '']);
    } catch (err: any) {
      toast.error('Failed to create poll');
    } finally {
      setSaving(false);
    }
  };

  const handleVote = async (poll: Poll, optionId: string) => {
    if (!user) return;
    const option = poll.options.find(o => o.id === optionId);
    if (!option) return;
    const hasVoted = option.votes.includes(user.id);
    if (hasVoted) {
      await supabase.from('poll_votes').delete()
        .eq('poll_option_id', optionId).eq('user_id', user.id);
    } else {
      // Remove any existing vote in this poll first
      for (const opt of poll.options) {
        if (opt.votes.includes(user.id)) {
          await supabase.from('poll_votes').delete()
            .eq('poll_option_id', opt.id).eq('user_id', user.id);
        }
      }
      await supabase.from('poll_votes').insert({ poll_option_id: optionId, user_id: user.id });
    }
    queryClient.invalidateQueries({ queryKey: ['polls', lobId] });
  };

  return (
    <div className="gradient-card rounded-2xl p-3 border border-border/50 shadow-card mb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">POLLS</p>
        </div>
        {canAddPoll && !showCreator && (
          <button
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary active:opacity-70"
          >
            <Plus className="w-3.5 h-3.5" /> Add poll
          </button>
        )}
      </div>

      {/* Existing polls */}
      {polls.length > 0 && (
        <div className="space-y-4 mb-3">
          {polls.map(poll => {
            const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
            const myVotedOption = poll.options.find(o => user && o.votes.includes(user.id));
            return (
              <div key={poll.id}>
                <p className="text-sm font-semibold text-foreground mb-2">{poll.question}</p>
                <div className="space-y-1.5">
                  {poll.options.map(opt => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                    const isMyVote = user ? opt.votes.includes(user.id) : false;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll, opt.id)}
                        className={`w-full text-left relative overflow-hidden rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${isMyVote ? 'border-primary/40' : 'border-border/50'}`}
                      >
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ${isMyVote ? 'bg-primary/15' : 'bg-secondary/50'}`}
                          style={{ width: myVotedOption ? `${pct}%` : '0%' }}
                        />
                        <div className="relative flex items-center justify-between px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {isMyVote && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            <span className="text-sm font-medium text-foreground">{opt.text}</span>
                          </div>
                          {myVotedOption && (
                            <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {totalVotes > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {polls.length === 0 && !showCreator && (
        <p className="text-xs text-muted-foreground mb-1">No polls yet</p>
      )}

      {/* Poll creator */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 pt-3 space-y-3">
              <input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center active:scale-95">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 5 && (
                <button onClick={addOption} className="text-xs font-semibold text-primary flex items-center gap-1 active:opacity-70">
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowCreator(false); setQuestion(''); setOptions(['', '']); }}
                  className="flex-1 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {saving ? 'Posting...' : 'Post poll'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
