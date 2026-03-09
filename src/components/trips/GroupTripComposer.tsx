import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, CalendarRange, MapPin, Minus, Plus, Compass, DollarSign } from 'lucide-react';
import { users, currentUser } from '@/data/seed';
import { Lob, TripPlanningMode, TripVibe } from '@/data/types';
import { lobStore } from '@/stores/lobStore';
import { toast } from 'sonner';

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

  const otherUsers = users.filter(u => u.id !== currentUser.id);

  const toggleUser = (uid: string) => {
    setSelectedUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

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

  const handleCreate = () => {
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
      'defined': `${destination.trim()}`,
      'dates-open': `${destination.trim()}`,
      'fully-open': vibes.length > 0
        ? `${vibes.map(v => VIBE_OPTIONS.find(o => o.key === v)?.label).join(' & ')} Trip`
        : 'Group Trip',
    };

    const newLob: Lob = {
      id: `gt-${Date.now()}`,
      title: titleMap[mode],
      category: 'group-trip',
      groupId: '',
      groupName: selectedUserIds.length > 0
        ? `${selectedUserIds.length + 1} travellers`
        : 'Open trip',
      createdBy: currentUser.id,
      location: mode !== 'fully-open' ? destination.trim() : undefined,
      destination: mode !== 'fully-open' ? destination.trim() : undefined,
      tripPlanningMode: mode,
      tripPlanningPhase: mode === 'defined' ? 'confirmed' : mode === 'dates-open' ? 'voting-dates' : 'voting-destination',
      tripStartDate: mode === 'defined' ? startDate : undefined,
      tripEndDate: mode === 'defined' ? endDate : undefined,
      tripTimeframe: mode !== 'defined' ? timeframe : undefined,
      tripBudget: mode === 'fully-open' ? budget || undefined : undefined,
      tripVibes: mode === 'fully-open' && vibes.length > 0 ? vibes : undefined,
      destinationOptions: mode === 'fully-open' ? [] : undefined,
      dateRangeOptions: mode === 'dates-open' ? [] : undefined,
      timeOptions: mode === 'defined'
        ? [{ id: `to-${Date.now()}`, datetime: `${startDate}T12:00`, votes: [] }]
        : [],
      whenMode: mode === 'defined' ? 'specific' : 'tbd',
      quorum: headcount,
      status: 'voting',
      responses: [{ userId: currentUser.id, response: 'in' }],
      createdAt: new Date().toISOString(),
    };

    lobStore.addLob(newLob);
    const label = mode === 'fully-open' ? 'Group trip' : destination.trim();
    toast.success(`${label} lobbed! 🌍`);
    reset();
    onClose();
    onCreated?.();
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
                        <input
                          type="text"
                          placeholder="e.g. Lisbon, Bali, Lake Como"
                          value={destination}
                          onChange={e => setDestination(e.target.value)}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
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
                      <div className="flex flex-wrap gap-2">
                        {otherUsers.map(u => {
                          const selected = selectedUserIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => toggleUser(u.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                                selected
                                  ? 'bg-primary/15 text-primary border border-primary/30'
                                  : 'bg-secondary text-muted-foreground border border-border'
                              }`}
                            >
                              <span className="text-sm">{u.avatar}</span>
                              {u.name}
                            </button>
                          );
                        })}
                      </div>
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
                    className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform"
                  >
                    🌍 Lob the Trip
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
