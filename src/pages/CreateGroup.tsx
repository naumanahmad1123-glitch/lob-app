import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Copy, Share2, X, Search, Phone, Link2, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const EMOJI_CATEGORIES: Record<string, string[]> = {
  Sports: ['🏀', '⚽', '🎾', '🏋️', '🏊', '⛷️', '🚴', '🏈', '🏓', '🥊'],
  Food: ['🍕', '🍷', '🍽️', '☕', '🍺', '🥞', '🍣', '🌮', '🍔', '🧁'],
  Social: ['🎉', '🎤', '🎬', '🎮', '🎲', '🪩', '🍿', '💃', '🎸', '🎨'],
  Travel: ['✈️', '🏖️', '⛺', '🚗', '🏔️', '🗺️', '🌍', '🛳️', '🚂', '🏕️'],
  Vibes: ['😎', '🔥', '💎', '🌙', '⚡', '🦋', '🌈', '✨', '💫', '🌊'],
};

const NAME_EMOJI_MAP: Record<string, string> = {
  hoop: '🏀', basket: '🏀', soccer: '⚽', football: '🏈', tennis: '🎾', padel: '🎾',
  gym: '🏋️', swim: '🏊', ski: '⛷️', bike: '🚴', run: '🏃', yoga: '🧘',
  dinner: '🍽️', lunch: '🍽️', brunch: '🥞', pizza: '🍕', sushi: '🍣', taco: '🌮',
  coffee: '☕', wine: '🍷', beer: '🍺', burger: '🍔', food: '🍕',
  party: '🎉', music: '🎤', movie: '🎬', game: '🎮', karaoke: '🎤',
  travel: '✈️', beach: '🏖️', camp: '⛺', hike: '🏔️', road: '🚗',
  chill: '😎', night: '🌙', dance: '💃', art: '🎨', book: '📚',
  squad: '👊', crew: '🤝', club: '🏛️', gang: '💪', team: '🏆',
};

function autoSuggestEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, emoji] of Object.entries(NAME_EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji;
  }
  return '🎯';
}

export default function CreateGroup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [customEmojiMode, setCustomEmojiMode] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [creating, setCreating] = useState(false);

  const displayEmoji = customEmojiMode ? customEmoji : selectedEmoji;
  const progressValue = ((step + 1) / 2) * 100;

  const handleCreate = async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          emoji: displayEmoji || '🎯',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      await supabase.from('group_members').insert({
        group_id: groupData.id,
        user_id: user.id,
      });

      queryClient.invalidateQueries({ queryKey: ['supabase-groups'] });
      toast.success('Group created! 🎉');
      navigate(`/groups/${groupData.id}`);
    } catch (err: any) {
      toast.error('Failed to create group: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : navigate('/connect'))}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {step === 0 ? 'Name & Identity' : 'Confirm'}
          </h1>
        </div>

        <Progress value={progressValue} className="h-1.5 mb-6 bg-secondary" />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-4xl shrink-0">
                  {displayEmoji || '❓'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Group preview</p>
                  <p className="text-lg font-bold text-foreground truncate">{groupName || 'Group name…'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Group Name</label>
                <Input placeholder="e.g. Hoop Squad" value={groupName} onChange={e => setGroupName(e.target.value)} className="h-12 text-base bg-secondary border-border/50" autoFocus />
              </div>

              <button onClick={() => { setCustomEmojiMode(false); setSelectedEmoji(autoSuggestEmoji(groupName)); }} className="flex items-center gap-2 text-sm font-medium text-primary active:scale-95 transition-transform cursor-pointer">
                <Sparkles className="w-4 h-4" /> Auto-suggest emoji
              </button>

              <div className="space-y-4">
                {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {emojis.map(e => (
                        <button key={e} onClick={() => { setSelectedEmoji(e); setCustomEmojiMode(false); }} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${selectedEmoji === e && !customEmojiMode ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-secondary hover:bg-secondary/80 active:scale-95'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => setStep(1)} disabled={!groupName.trim()} className="w-full h-12 text-base font-semibold rounded-xl gradient-primary">
                Next
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-5xl">
                  {displayEmoji || '🎯'}
                </div>
                <h2 className="text-xl font-bold text-foreground">{groupName}</h2>
                <p className="text-sm text-muted-foreground">You'll be the first member. You can invite others later.</p>
              </div>

              <Button onClick={handleCreate} disabled={creating} className="w-full h-13 text-base font-semibold rounded-xl gradient-primary">
                {creating ? 'Creating...' : 'Create Group'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
