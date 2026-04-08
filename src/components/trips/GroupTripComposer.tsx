import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, CalendarRange, MapPin, Minus, Plus, Compass, DollarSign } from 'lucide-react';
import { TripPlanningMode, TripVibe } from '@/data/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlacesAutocomplete } from '@/components/ui/PlacesAutocomplete';

interface GroupTripComposerProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step = 'mode' | 'details';

const MODE_OPTIONS: { mode: TripPlanningMode; emoji: string; title: string; description: string }[] = [
  { mode: 'defined', emoji: '✈️', title: 'Defined Trip', description: 'Destination and dates are set. Just need people.' },
  { mode: 'dates-open', emoji: '📅', title: 'Dates Open', description: 'We know where — need to agree on when.' },
  { mode: 'fully-open', emoji: '🌐', title: 'Fully Open', description: 'Where should we go? Let the group decide.' },
];

const VIBE_OPTIONS: { key: TripVibe; emoji: string; label: string }[] = [
  { key: 'beach', emoji: '🏖️', label: 'Beach' },
  { key: 'city', emoji: '🏙️', label: 'City' },
  { key: 'adventure', emoji: '🧗', label: 'Adventure' },
  { key: 'ski', emoji: '⛷️', label: 'Ski' },
  { key: 'cultural', emoji: '🏛️', label: 'Cultural' },
  { key: 'roadtrip', emoji: '🚗', label: 'Road Trip' },
];

export function GroupTripComposer({ open, onClose, onCreated }: GroupTripComposerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<TripPlanningMode>('defined');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [budget, setBudget] = useState('');
  const [vibes, setVibes] = useState<TripVibe[]>([]);
  const [headcount, setHeadcount] = useState(4);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const toggleVibe = (v: TripVibe) => {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const reset = () => {
    setStep('mode');
    setMode('defined');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setTimeframe('');
    setBudget('');
    setVibes([]);
    setHeadcount(4);
    setSelectedUserIds([]);
  };

  const handleCreate = async () => {
    if (!user || sending) return;
    if (mode === 'defined') {
      if (!destination.trim()) { toast.error('Where are you going?'); return; }
      if (!startDate || !endDate) { toast.error('Pick your dates'); return; }
    } else if (mode === 'dates-open') {
      if (!destination.trim()) { toast.error('Where are you going?'); return; }
      if (!timeframe.trim()) { toast.error('Give a rough timeframe'); return; }
    } else {
      if (!timeframe.trim()) { toast.error('Give a rough timeframe'); return; }
    }

    const titleMap: Record<TripPlanningMode, string> = {
      'defined': destination.trim(),
      'dates-open': destination.trim(),
      'fully-open': vibes.length > 0
        ? `${vibes.map(v => VIBE_OPTIONS.find(o => o.key === v)?.label).join(' & ')} Trip`
        : 'Group Trip',
    };

    setSending(true);
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('groups_trips')
        .insert({
          created_by: user.id,
          title: titleMap[mode],
          planning_mode: mode,
          destination: mode !== 'fully-open' ? destination.trim() : null,
          start_date: mode === 'defined' ? startDate : null,
          end_date: mode === 'defined' ? endDate : null,
          timeframe: mode !== 'defined' ? timeframe : null,
          vibes: vibes.length > 0 ? vibes.join(',') : null,
          budget: budget || null,
          headcount,
          status: 'voting',
          emoji: '🌍',
        })
        .select('id')
        .single();

      if (tripError) throw tripError;

      // Add creator as member
      await supabase.from('trip_members').insert({
        trip_id: tripData.id,
        user_id: user.id,
        status: 'in',
      });

      // Add any selected user IDs as invited members
      if (selectedUserIds.length > 0) {
        await supabase.from('trip_members').insert(
          selectedUserIds.map(uid => ({ trip_id: tripData.id, user_id: uid, status: 'invited' }))
        );
      }

      queryClient.invalidateQueries({ queryKey: ['supabase-group-trips'] });
      const label = mode === 'fully-open' ? 'Group trip' : destination.trim();
      toast.success(`${label} lobbed! 🌍`);
      reset();
      onClose();
      onCreated?.();
    } catch (err: any) {
      console.error('Failed to create group trip:', err);
      toast.error('Failed to create trip');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border border-border/50 shadow-card pt-4 max-h-[85vh] flex flex-col">
              <div className="flex justify-center mb-3 px-5">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="flex items-center justify-between mb-5 px-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <h2 className="text-lg font-extrabold text-foreground">Plan a Group Trip</h2>
                </div>
                <button onClick={() => { reset(); onClose(); }} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5">
              <AnimatePresence mode="wait">
                {step === 'mode' ? (
                  <motion.div
                    key="mode"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-semibold text-muted-foreground mb-1">What stage is this trip at?</p>
                    {MODE_OPTIONS.map(opt => (
                      <button
                        key={opt.mode}
                        onClick={() => { setMode(opt.mode); setStep('details'); }}
                        className="w-full text-left p-4 rounded-2xl border border-border/50 bg-secondary/30 hover:border-primary/50 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{opt.emoji}</span>
                          <div>
                            <p className="font-bold text-foreground text-sm">{opt.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Back button */}
                    <button
                      onClick={() => setStep('mode')}
                      className="text-xs font-semibold text-primary flex items-center gap-1 mb-1"
                    >
                      ← Change trip type
                    </button>

                    {/* Mode badge */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-lg">{MODE_OPTIONS.find(o => o.mode === mode)?.emoji}</span>
                      <span className="text-sm font-semibold text-foreground">{MODE_OPTIONS.find(o => o.mode === mode)?.title}</span>
                    </div>

                    {/* Destination — for defined and dates-open */}
                    {mode !== 'fully-open' && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          Where to?
                        </label>
                        <PlacesAutocomplete
                          value={destination}
                          onChange={setDestination}
                          onSelect={result => setDestination(result.name)}
                          placeholder="Where are you going?"
                        />
                      </div>
                    )}

                    {/* Vibes — fully-open only */}
                    {mode === 'fully-open' && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          What vibe?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {VIBE_OPTIONS.map(v => (
                            <button
                              key={v.key}
                              onClick={() => toggleVibe(v.key)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                                vibes.includes(v.key)
                                  ? 'bg-primary/15 text-primary border border-primary/30'
                                  : 'bg-secondary text-muted-foreground border border-border'
                              }`}
                            >
                              <span>{v.emoji}</span>
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates — defined only */}
                    {mode === 'defined' && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <CalendarRange className="w-3.5 h-3.5" />
                          When?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">From</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={e => setStartDate(e.target.value)}
                              className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">To</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={e => setEndDate(e.target.value)}
                              className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeframe — dates-open and fully-open */}
                    {mode !== 'defined' && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <CalendarRange className="w-3.5 h-3.5" />
                          Rough timeframe
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sometime in August, Q3, Summer 2026"
                          value={timeframe}
                          onChange={e => setTimeframe(e.target.value)}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}

                    {/* Budget — fully-open only */}
                    {mode === 'fully-open' && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Rough budget (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. $1k–2k per person"
                          value={budget}
                          onChange={e => setBudget(e.target.value)}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}

                    {/* Headcount */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        How many to make it happen?
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setHeadcount(Math.max(2, headcount - 1))}
                          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-bold text-foreground w-8 text-center">{headcount}</span>
                        <button
                          onClick={() => setHeadcount(Math.min(20, headcount + 1))}
                          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-muted-foreground">people needed</span>
                      </div>
                    </div>

                    {/* Invite people */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Who's invited?
                      </label>
                      <input
                        type="text"
                        placeholder="Invite by user ID (optional)"
                        onChange={e => setSelectedUserIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>

              {/* Pinned footer with submit button */}
              {step === 'details' && (
                <div className="shrink-0 px-5 pt-3 border-t border-border/50 bg-card" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                  <button
                    onClick={handleCreate}
                    disabled={sending}
                    className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {sending ? 'Lobbing...' : '🌍 Lob the Trip'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
