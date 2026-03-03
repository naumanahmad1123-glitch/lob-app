import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Users, Plus, X, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { groups } from '@/data/seed';
import { CATEGORY_CONFIG, LobCategory } from '@/data/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const steps = ['Group', 'Category', 'When', 'Where', 'Review'];

interface TimeSlot {
  date: Date | undefined;
  time: string;
}

const TimeSlotPicker = ({
  slot,
  onChange,
  onRemove,
  showRemove,
}: {
  slot: TimeSlot;
  onChange: (s: TimeSlot) => void;
  onRemove?: () => void;
  showRemove: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex-1 flex items-center gap-2 p-3 rounded-xl border border-border bg-input text-sm text-left',
              !slot.date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {slot.date ? format(slot.date, 'PPP') : 'Pick date'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={slot.date}
            onSelect={(d) => onChange({ ...slot, date: d })}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
      <input
        type="time"
        value={slot.time}
        onChange={(e) => onChange({ ...slot, time: e.target.value })}
        className="w-28 p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
      />
    </div>
    {showRemove && onRemove && (
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    )}
  </div>
);

const CreateLob = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LobCategory | ''>('');
  const [title, setTitle] = useState('');

  // Time state: single fixed time by default
  const [fixedTime, setFixedTime] = useState<TimeSlot>({ date: undefined, time: '' });
  const [useTimePoll, setUseTimePoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<TimeSlot[]>([
    { date: undefined, time: '' },
    { date: undefined, time: '' },
  ]);

  const [location, setLocation] = useState('');

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => {
    if (step === 0) navigate(-1);
    else setStep((s) => s - 1);
  };

  const send = () => {
    navigate('/');
  };

  const group = groups.find((g) => g.id === selectedGroup);
  const catConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : null;

  const validTimeOptions = useTimePoll
    ? pollOptions.filter((o) => o.date && o.time)
    : fixedTime.date && fixedTime.time
      ? [fixedTime]
      : [];

  const canProceedFromWhen = validTimeOptions.length > 0;

  const updatePollOption = (i: number, s: TimeSlot) => {
    const updated = [...pollOptions];
    updated[i] = s;
    setPollOptions(updated);
  };

  const removePollOption = (i: number) => {
    setPollOptions(pollOptions.filter((_, j) => j !== i));
  };

  const addPollOption = () => {
    if (pollOptions.length < 3) {
      setPollOptions([...pollOptions, { date: undefined, time: '' }]);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={back} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-foreground">Create a Lob</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
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
            {/* Step 0: Group */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Who's in?</h2>
                <p className="text-sm text-muted-foreground mb-4">Pick a group to lob to</p>
                <div className="space-y-2">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => { setSelectedGroup(g.id); next(); }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        selectedGroup === g.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <div className="text-left">
                        <p className="font-semibold text-foreground text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.members.length} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Category */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">What's the plan?</h2>
                <p className="text-sm text-muted-foreground mb-4">Pick a category</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(Object.entries(CATEGORY_CONFIG) as [LobCategory, typeof CATEGORY_CONFIG[LobCategory]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedCategory(key); setTitle(val.label); }}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        selectedCategory === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xl">{val.emoji}</span>
                      <span className="font-medium text-sm text-foreground">{val.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Plan title (e.g. Friday Hoops)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={next}
                  disabled={!selectedCategory || !title}
                  className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 2: When */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">When?</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {useTimePoll ? 'Add up to 3 options for the group to vote on' : 'Pick a date & time'}
                </p>

                {!useTimePoll ? (
                  <>
                    {/* Single fixed time */}
                    <TimeSlotPicker
                      slot={fixedTime}
                      onChange={setFixedTime}
                      showRemove={false}
                    />
                    {/* Toggle to time poll */}
                    <button
                      onClick={() => {
                        setUseTimePoll(true);
                        // Seed first poll option from fixed time if it was filled
                        if (fixedTime.date || fixedTime.time) {
                          setPollOptions([{ ...fixedTime }, { date: undefined, time: '' }]);
                        }
                      }}
                      className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Add time options — let the group vote
                    </button>
                  </>
                ) : (
                  <>
                    {/* Multiple time poll options */}
                    <div className="space-y-3">
                      {pollOptions.map((opt, i) => (
                        <div key={i}>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Option {i + 1}</p>
                          <TimeSlotPicker
                            slot={opt}
                            onChange={(s) => updatePollOption(i, s)}
                            onRemove={() => removePollOption(i)}
                            showRemove={pollOptions.length > 2}
                          />
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
                    {/* Switch back to fixed time */}
                    <button
                      onClick={() => setUseTimePoll(false)}
                      className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
                    >
                      Switch to a single fixed time
                    </button>
                  </>
                )}

                <button
                  onClick={next}
                  disabled={!canProceedFromWhen}
                  className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 3: Where */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Where?</h2>
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
                  onClick={next}
                  className="w-full mt-4 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                >
                  Review
                </button>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Review your Lob</h2>
                <div className="gradient-card rounded-2xl p-5 border border-border/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{catConfig?.emoji}</span>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{title}</h3>
                      <p className="text-sm text-muted-foreground">{group?.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {useTimePoll && (
                          <span className="text-xs font-medium text-primary mb-0.5">⏱ Time Poll</span>
                        )}
                        {validTimeOptions.map((o, i) => (
                          <span key={i}>{format(o.date!, 'PPP')} at {o.time}</span>
                        ))}
                      </div>
                    </div>
                    {location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Quorum: {catConfig?.defaultQuorum} needed</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={send}
                  className="w-full mt-6 py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-glow animate-pulse-glow"
                >
                  🏐 Lob It!
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default CreateLob;
