import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Users, Plus, X, CalendarIcon, Timer, ChevronUp, ArrowUp, Repeat, Search, Minus, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, addHours, setHours, setMinutes, startOfTomorrow } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { groups, users } from '@/data/seed';
import { CATEGORY_CONFIG, LobCategory, RecurrenceType, RECURRENCE_OPTIONS, WhenMode, FlexibleWindow, FLEXIBLE_WINDOW_OPTIONS } from '@/data/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const STEP_LABELS = ['What?', 'Who?', 'When?', 'Where?', 'How many?', 'Deadline?', 'Confirm'];
const TOTAL_STEPS = STEP_LABELS.length;

interface TimeSlot {
  date: Date | undefined;
  time: string;
}

function generateDayChips(): { label: string; date: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    let label: string;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = format(d, 'EEE d');
    return { label, date: d };
  });
}

function generateTimeChips(): string[] {
  const chips: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      const d = new Date();
      d.setHours(h, m, 0, 0);
      chips.push(format(d, 'h:mm a'));
    }
  }
  return chips;
}

const DAY_CHIPS = generateDayChips();
const TIME_CHIPS = generateTimeChips();

function isSameDay(a: Date | undefined, b: Date): boolean {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const ChipRow = ({
  items,
  selected,
  onSelect,
  onPickCustom,
}: {
  items: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onPickCustom: () => void;
}) => (
  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
    {items.map((item) => (
      <button
        key={item.value}
        onClick={() => onSelect(item.value)}
        className={cn(
          'shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all snap-start',
          selected === item.value
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
        )}
      >
        {item.label}
      </button>
    ))}
    <button
      onClick={onPickCustom}
      className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-border text-muted-foreground hover:border-primary/50 transition-colors flex items-center gap-1.5 snap-start"
    >
      <CalendarIcon className="w-3.5 h-3.5" />
      Other
    </button>
  </div>
);

type DeadlinePreset = '2h' | '6h' | 'tonight' | 'tomorrow' | 'custom';

const DEADLINE_PRESETS: { key: DeadlinePreset; label: string }[] = [
  { key: '2h', label: '2 hours' },
  { key: '6h', label: '6 hours' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'tomorrow', label: 'Tomorrow AM' },
  { key: 'custom', label: 'Custom' },
];

function resolveDeadlinePreset(key: DeadlinePreset): Date | null {
  const now = new Date();
  switch (key) {
    case '2h': return addHours(now, 2);
    case '6h': return addHours(now, 6);
    case 'tonight': return setMinutes(setHours(now, 23), 59);
    case 'tomorrow': return setMinutes(setHours(startOfTomorrow(), 9), 0);
    default: return null;
  }
}

const QUICK_TEMPLATES = [
  { label: '🏀 Hoops', title: 'Hoops', category: 'sports' as LobCategory },
  { label: '☕ Coffee', title: 'Coffee', category: 'coffee' as LobCategory },
  { label: '🍜 Dinner', title: 'Dinner', category: 'dinner' as LobCategory },
  { label: '🎾 Padel', title: 'Padel', category: 'padel' as LobCategory },
  { label: '💪 Gym', title: 'Gym', category: 'gym' as LobCategory },
  { label: '🍹 Drinks', title: 'Drinks', category: 'other' as LobCategory },
  { label: '🎬 Movie night', title: 'Movie night', category: 'chill' as LobCategory },
  { label: '🚶 Walk', title: 'Walk', category: 'other' as LobCategory },
];

// ─── Review Swipe Card ───
interface ReviewSwipeCardProps {
  title: string;
  category: LobCategory | '';
  groupName?: string;
  peopleName?: string;
  validTimeOptions: TimeSlot[];
  useTimePoll: boolean;
  whenMode: WhenMode;
  flexibleWindow: FlexibleWindow | '';
  location: string;
  quorum: number;
  resolvedDeadline: Date | null;
  recurrence?: string;
  onLob: () => void;
  onEdit: (step: number) => void;
}

function ReviewSwipeCard({
  title, category, groupName, peopleName, validTimeOptions, useTimePoll, whenMode, flexibleWindow, location, quorum, resolvedDeadline, recurrence, onLob, onEdit,
}: ReviewSwipeCardProps) {
  const dragY = useMotionValue(0);
  const cardOpacity = useTransform(dragY, [0, -140], [1, 0.3]);
  const cardScale = useTransform(dragY, [0, -140], [1, 0.92]);
  const hintOp = useTransform(dragY, [0, -30], [1, 0]);
  const [launched, setLaunched] = useState(false);
  const catConfig = category ? CATEGORY_CONFIG[category] : null;

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < -70 || info.velocity.y < -300) {
      setLaunched(true);
      setTimeout(() => onLob(), 500);
    }
  }, [onLob]);

  if (launched) {
    return (
      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -400, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="gradient-card rounded-2xl p-5 border border-border/50 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{catConfig?.emoji}</span>
              <div>
                <h3 className="font-bold text-foreground text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{groupName || peopleName}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const Row = ({ icon: Icon, children, step }: { icon: any; children: React.ReactNode; step: number }) => (
    <div className="flex items-start gap-2 text-muted-foreground group">
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm">{children}</div>
      <button onClick={() => onEdit(step)} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 className="w-3.5 h-3.5 text-primary" />
      </button>
    </div>
  );

  return (
    <div className="select-none">
      <h2 className="text-lg font-bold text-foreground mb-4">Review your Lob</h2>

      <div className="flex justify-center mb-2">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          style={{ opacity: hintOp }}
        >
          <ArrowUp className="w-6 h-6 text-primary" strokeWidth={2.5} />
        </motion.div>
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: -200, bottom: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ y: dragY, opacity: cardOpacity, scale: cardScale }}
        whileTap={{ cursor: 'grabbing' }}
        className="gradient-card rounded-2xl p-5 border border-border/50 space-y-3 cursor-grab"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{catConfig?.emoji}</span>
          <div>
            <h3 className="font-bold text-foreground text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{groupName || peopleName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Row icon={Clock} step={2}>
            <div className="flex flex-col gap-0.5">
              {whenMode === 'tbd' && <span>Time TBD</span>}
              {whenMode === 'flexible' && flexibleWindow && (
                <span>{FLEXIBLE_WINDOW_OPTIONS.find(o => o.key === flexibleWindow)?.displayLabel}</span>
              )}
              {whenMode === 'flexible' && !flexibleWindow && <span>Flexible timing</span>}
              {whenMode === 'specific' && (
                <>
                  {useTimePoll && <span className="text-xs font-medium text-primary">⏱ Time Poll</span>}
                  {validTimeOptions.length > 0 ? validTimeOptions.map((o, i) => (
                    <span key={i}>{o.date ? format(o.date, 'EEE, MMM d') : ''} at {o.time}</span>
                  )) : <span>No time set</span>}
                </>
              )}
            </div>
          </Row>
          {location && <Row icon={MapPin} step={3}>{location}</Row>}
          <Row icon={Users} step={4}>{quorum} to make it happen</Row>
          {resolvedDeadline && (
            <Row icon={Timer} step={5}>Deadline: {format(resolvedDeadline, 'EEE, MMM d \'at\' h:mm a')}</Row>
          )}
          {recurrence && (
            <div className="flex items-center gap-2 text-primary text-sm">
              <Repeat className="w-4 h-4" />
              <span>{RECURRENCE_OPTIONS.find(r => r.key === recurrence)?.label}</span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.p
        style={{ opacity: hintOp }}
        className="text-center text-[11px] font-semibold text-muted-foreground mt-3 flex items-center justify-center gap-1"
      >
        <ChevronUp className="w-3.5 h-3.5" /> Swipe up to lob it
      </motion.p>
    </div>
  );
}

// ─── Main Component ───
const CreateLob = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0: What?
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LobCategory | ''>('');

  // Step 1: Who?
  const [whoMode, setWhoMode] = useState<'group' | 'people'>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [peopleSearch, setPeopleSearch] = useState('');

  // Step 2: When?
  const [whenMode, setWhenMode] = useState<WhenMode>('flexible');
  const [fixedTime, setFixedTime] = useState<TimeSlot>({ date: undefined, time: '' });
  const [useTimePoll, setUseTimePoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<TimeSlot[]>([
    { date: undefined, time: '' },
    { date: undefined, time: '' },
  ]);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [flexibleWindow, setFlexibleWindow] = useState<FlexibleWindow | ''>('');

  // Step 3: Where?
  const [location, setLocation] = useState('');

  // Step 4: How many?
  const [quorum, setQuorum] = useState(2);

  // Step 5: Deadline?
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset | ''>('');
  const [customDeadlineDate, setCustomDeadlineDate] = useState<Date | undefined>(undefined);
  const [customDeadlineTime, setCustomDeadlineTime] = useState('');

  // Recurrence (lives on Where step)
  const [recurrence, setRecurrence] = useState<RecurrenceType | ''>('');

  const group = groups.find((g) => g.id === selectedGroup);

  const validTimeOptions = useTimePoll
    ? pollOptions.filter((o) => o.date && o.time)
    : fixedTime.date && fixedTime.time ? [fixedTime] : [];

  const resolvedDeadline = (() => {
    if (!deadlinePreset) return null;
    if (deadlinePreset === 'custom') {
      if (customDeadlineDate && customDeadlineTime) {
        const [h, m] = customDeadlineTime.split(':').map(Number);
        const d = new Date(customDeadlineDate);
        d.setHours(h, m, 0, 0);
        return d;
      }
      return null;
    }
    return resolveDeadlinePreset(deadlinePreset);
  })();

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!title.trim() && !!selectedCategory;
      case 1: return whoMode === 'group' ? !!selectedGroup : selectedPeople.length > 0;
      case 2: return true; // fully optional
      case 3: return true; // optional
      case 4: return true; // optional
      case 5: return true; // optional
      default: return false;
    }
  }, [step, title, selectedCategory, whoMode, selectedGroup, selectedPeople]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => {
    if (step === 0) navigate(-1);
    else setStep((s) => s - 1);
  };
  const send = () => navigate('/');

  const isOptional = step >= 2 && step <= 5;
  const buttonLabel = step === TOTAL_STEPS - 2 ? 'Review' : isOptional && !canProceed ? 'Skip' : 'Next';

  const updatePollOption = (i: number, s: TimeSlot) => {
    const updated = [...pollOptions];
    updated[i] = s;
    setPollOptions(updated);
  };
  const removePollOption = (i: number) => setPollOptions(pollOptions.filter((_, j) => j !== i));
  const addPollOption = () => { if (pollOptions.length < 3) setPollOptions([...pollOptions, { date: undefined, time: '' }]); };

  const filteredPeople = users.filter(u =>
    u.id !== 'u1' && u.name.toLowerCase().includes(peopleSearch.toLowerCase())
  );

  const selectedPeopleNames = users.filter(u => selectedPeople.includes(u.id)).map(u => u.name).join(', ');

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={back} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-foreground">{STEP_LABELS[step]}</h1>
          <span className="ml-auto text-xs text-muted-foreground font-medium">{step + 1}/{TOTAL_STEPS}</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Step 0: What? ── */}
            {step === 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Name your plan</p>
                <input
                  type="text"
                  placeholder="What are you thinking?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">What's the vibe?</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((t) => (
                    <button
                      key={t.title}
                      onClick={() => { setTitle(t.title); setSelectedCategory(t.category); }}
                      className={cn(
                        'px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                        title === t.title && selectedCategory === t.category
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-medium text-muted-foreground mt-5 mb-2">Category</p>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(CATEGORY_CONFIG) as [LobCategory, typeof CATEGORY_CONFIG[LobCategory]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center',
                        selectedCategory === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      <span className="text-lg">{val.emoji}</span>
                      <span className="text-[11px] font-medium text-foreground">{val.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={next}
                  disabled={!canProceed}
                  className="w-full mt-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
                >
                  Next
                </button>
              </div>
            )}

            {/* ── Step 1: Who? ── */}
            {step === 1 && (
              <div>
                <div className="flex gap-2 mb-4">
                  {(['group', 'people'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setWhoMode(m)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        whoMode === m
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground'
                      )}
                    >
                      {m === 'group' ? 'Group' : 'People'}
                    </button>
                  ))}
                </div>

                {whoMode === 'group' ? (
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 rounded-xl border transition-all',
                          selectedGroup === g.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
                        )}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <div className="text-left">
                          <p className="font-semibold text-foreground text-sm">{g.name}</p>
                          <p className="text-xs text-muted-foreground">{g.members.length} members</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={peopleSearch}
                        onChange={(e) => setPeopleSearch(e.target.value)}
                        className="w-full p-3 pl-9 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {selectedPeople.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedPeople.map((id) => {
                          const u = users.find(x => x.id === id);
                          return u ? (
                            <span key={id} className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium flex items-center gap-1">
                              {u.avatar} {u.name}
                              <button onClick={() => setSelectedPeople(prev => prev.filter(p => p !== id))}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {filteredPeople.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedPeople(prev =>
                            prev.includes(u.id) ? prev.filter(p => p !== u.id) : [...prev, u.id]
                          )}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                            selectedPeople.includes(u.id) ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
                          )}
                        >
                          <span className="text-xl">{u.avatar}</span>
                          <span className="text-sm font-medium text-foreground">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={next}
                  disabled={!canProceed}
                  className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
                >
                  Next
                </button>
              </div>
            )}

            {/* ── Step 2: When? ── */}
            {step === 2 && (
              <div>
                {/* Mode selector */}
                <div className="flex gap-2 mb-5">
                  {([
                    { key: 'flexible' as WhenMode, label: '🌊 Flexible', desc: 'Loose window' },
                    { key: 'specific' as WhenMode, label: '📌 Specific', desc: 'Exact time' },
                    { key: 'tbd' as WhenMode, label: '🤷 TBD', desc: 'Decide later' },
                  ]).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setWhenMode(m.key)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl border transition-all',
                        whenMode === m.key
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      <span className="text-sm font-semibold">{m.label}</span>
                      <span className="text-[10px]">{m.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Flexible mode */}
                {whenMode === 'flexible' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Pick a rough timeframe</p>
                    <div className="flex flex-wrap gap-2">
                      {FLEXIBLE_WINDOW_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setFlexibleWindow(prev => prev === opt.key ? '' : opt.key)}
                          className={cn(
                            'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                            flexibleWindow === opt.key
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {flexibleWindow && (
                      <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {FLEXIBLE_WINDOW_OPTIONS.find(o => o.key === flexibleWindow)?.displayLabel}
                      </div>
                    )}
                  </div>
                )}

                {/* Specific mode */}
                {whenMode === 'specific' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {useTimePoll ? 'Add up to 3 options for the group to vote on' : 'Pick a day & time'}
                    </p>

                    {!useTimePoll ? (
                      <>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Day</p>
                        <ChipRow
                          items={DAY_CHIPS.map(c => ({ label: c.label, value: c.date.toISOString() }))}
                          selected={fixedTime.date ? DAY_CHIPS.find(c => isSameDay(fixedTime.date, c.date))?.date.toISOString() || '' : ''}
                          onSelect={(v) => setFixedTime({ ...fixedTime, date: new Date(v) })}
                          onPickCustom={() => setShowCustomDatePicker(true)}
                        />

                        {showCustomDatePicker && (
                          <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
                            <PopoverTrigger asChild>
                              <button className="w-full mt-2 p-3 rounded-xl border border-primary bg-primary/10 text-sm text-primary text-center">
                                {fixedTime.date ? format(fixedTime.date, 'PPP') : 'Pick a custom date'}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                              <Calendar
                                mode="single"
                                selected={fixedTime.date}
                                onSelect={(d) => { setFixedTime({ ...fixedTime, date: d }); setShowCustomDatePicker(false); }}
                                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                                className={cn('p-3 pointer-events-auto')}
                              />
                            </PopoverContent>
                          </Popover>
                        )}

                        <p className="text-xs font-medium text-muted-foreground mb-2 mt-4">Time</p>
                        <ChipRow
                          items={TIME_CHIPS.map(t => ({ label: t, value: t }))}
                          selected={fixedTime.time}
                          onSelect={(v) => setFixedTime({ ...fixedTime, time: v })}
                          onPickCustom={() => setShowCustomTimePicker(true)}
                        />

                        {showCustomTimePicker && (
                          <div className="mt-2 flex gap-2 items-center">
                            <input
                              type="time"
                              value={customTimeInput}
                              onChange={(e) => {
                                setCustomTimeInput(e.target.value);
                                if (e.target.value) {
                                  const [h, m] = e.target.value.split(':').map(Number);
                                  const d = new Date();
                                  d.setHours(h, m, 0, 0);
                                  setFixedTime({ ...fixedTime, time: format(d, 'h:mm a') });
                                }
                              }}
                              className="flex-1 p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                            />
                            <button onClick={() => setShowCustomTimePicker(false)} className="text-xs text-primary font-medium">Done</button>
                          </div>
                        )}

                        {fixedTime.date && fixedTime.time && (
                          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(fixedTime.date, 'EEE, MMM d')} at {fixedTime.time}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setUseTimePoll(true);
                            if (fixedTime.date || fixedTime.time) {
                              setPollOptions([{ ...fixedTime }, { date: undefined, time: '' }]);
                            }
                          }}
                          className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add more time options
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {pollOptions.map((opt, i) => (
                            <div key={i} className="p-3 rounded-xl border border-border bg-card/50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-muted-foreground">Option {i + 1}</p>
                                {pollOptions.length > 2 && (
                                  <button onClick={() => removePollOption(i)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                                    <X className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">Day</p>
                              <ChipRow
                                items={DAY_CHIPS.map(c => ({ label: c.label, value: c.date.toISOString() }))}
                                selected={opt.date ? DAY_CHIPS.find(c => isSameDay(opt.date, c.date))?.date.toISOString() || '' : ''}
                                onSelect={(v) => updatePollOption(i, { ...opt, date: new Date(v) })}
                                onPickCustom={() => {}}
                              />
                              <p className="text-xs font-medium text-muted-foreground mb-1.5 mt-3">Time</p>
                              <ChipRow
                                items={TIME_CHIPS.map(t => ({ label: t, value: t }))}
                                selected={opt.time}
                                onSelect={(v) => updatePollOption(i, { ...opt, time: v })}
                                onPickCustom={() => {}}
                              />
                              {opt.date && opt.time && (
                                <div className="mt-2 text-xs text-primary flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  {format(opt.date, 'EEE, MMM d')} at {opt.time}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {pollOptions.length < 3 && (
                          <button
                            onClick={addPollOption}
                            className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add option {pollOptions.length + 1}
                          </button>
                        )}
                        <button
                          onClick={() => setUseTimePoll(false)}
                          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
                        >
                          Switch to a single fixed time
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* TBD mode */}
                {whenMode === 'tbd' && (
                  <div className="text-center py-6">
                    <span className="text-4xl mb-3 block">🤷</span>
                    <p className="text-sm text-muted-foreground mb-1">Figure it out later</p>
                    <p className="text-xs text-muted-foreground/70">Members can suggest times in the comments after the lob is created.</p>
                    <div className="mt-4 p-3 rounded-xl bg-secondary border border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time TBD
                    </div>
                  </div>
                )}

                <button
                  onClick={next}
                  className="w-full mt-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                >
                  Next
                </button>
              </div>
            )}

            {/* ── Step 3: Where? ── */}
            {step === 3 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Add a location (optional)</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search a place..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-3 pl-9 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={() => { setLocation('TBD'); }}
                  className={cn(
                    'mt-3 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    location === 'TBD'
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  📍 TBD — decide later
                </button>

                {/* Repeat toggle */}
                <div className="mt-5 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Repeat</span>
                    </div>
                    <button
                      onClick={() => setRecurrence(recurrence ? '' : 'weekly')}
                      className={cn(
                        'text-xs font-medium px-3 py-1 rounded-full transition-colors',
                        recurrence ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {recurrence ? 'On' : 'Optional'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {recurrence && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2">
                          {RECURRENCE_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setRecurrence(opt.key)}
                              className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                recurrence === opt.key
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={next}
                  className="w-full mt-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                >
                  {location ? 'Next' : 'Skip'}
                </button>
              </div>
            )}

            {/* ── Step 4: How many? ── */}
            {step === 4 && (
              <div>
                <p className="text-sm text-muted-foreground mb-6">How many people do you need?</p>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setQuorum(Math.max(2, quorum - 1))}
                    className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <Minus className="w-5 h-5 text-foreground" />
                  </button>
                  <span className="text-5xl font-extrabold text-primary tabular-nums">{quorum}</span>
                  <button
                    onClick={() => setQuorum(Math.min(50, quorum + 1))}
                    className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-foreground" />
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-3">Minimum people to make it happen</p>
                <button
                  onClick={next}
                  className="w-full mt-8 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                >
                  Next
                </button>
              </div>
            )}

            {/* ── Step 5: Deadline? ── */}
            {step === 5 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Set a voting deadline (optional)</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {DEADLINE_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setDeadlinePreset(prev => prev === p.key ? '' : p.key)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                        deadlinePreset === p.key
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {deadlinePreset === 'custom' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          'flex-1 flex items-center gap-2 p-2.5 rounded-xl border border-border bg-input text-sm text-left',
                          !customDeadlineDate && 'text-muted-foreground'
                        )}>
                          <CalendarIcon className="w-4 h-4" />
                          {customDeadlineDate ? format(customDeadlineDate, 'MMM d') : 'Date'}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDeadlineDate}
                          onSelect={setCustomDeadlineDate}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="time"
                      value={customDeadlineTime}
                      onChange={e => setCustomDeadlineTime(e.target.value)}
                      className="w-24 p-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                    />
                  </motion.div>
                )}

                {resolvedDeadline && (
                  <p className="text-xs text-muted-foreground">
                    Expires {format(resolvedDeadline, 'EEE, MMM d \'at\' h:mm a')}
                  </p>
                )}

                <button
                  onClick={next}
                  className="w-full mt-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                >
                  {deadlinePreset ? 'Review' : 'Skip'}
                </button>
              </div>
            )}

            {/* ── Step 6: Confirm ── */}
            {step === 6 && (
              <ReviewSwipeCard
                title={title}
                category={selectedCategory}
                groupName={group?.name}
                peopleName={selectedPeopleNames || undefined}
                validTimeOptions={validTimeOptions}
                useTimePoll={useTimePoll}
                whenMode={whenMode}
                flexibleWindow={flexibleWindow}
                location={location}
                quorum={quorum}
                resolvedDeadline={resolvedDeadline}
                recurrence={recurrence || undefined}
                onLob={send}
                onEdit={(s) => setStep(s)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default CreateLob;
