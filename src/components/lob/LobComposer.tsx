import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, MapPin, Clock, Users, ChevronRight, Sparkles, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { groups } from '@/data/seed';
import { CATEGORY_CONFIG, LobCategory } from '@/data/types';

type ComposerStep = 'quick' | 'group' | 'category' | 'time' | 'location' | 'review';

interface ParsedLob {
  title: string;
  category: LobCategory | '';
  time: string;
  location: string;
  groupId: string;
}

const TEMPLATES = [
  { text: 'Hoops tonight 8pm', emoji: '🏀' },
  { text: 'Coffee tomorrow 4pm', emoji: '☕' },
  { text: 'Dinner Friday 7pm', emoji: '🍽️' },
  { text: 'Padel Saturday 10am', emoji: '🎾' },
  { text: 'Gym session 6pm', emoji: '💪' },
];

const CATEGORY_KEYWORDS: Record<string, LobCategory> = {
  hoops: 'sports', basketball: 'sports', soccer: 'sports', football: 'sports',
  dinner: 'dinner', sushi: 'dinner', brunch: 'dinner', lunch: 'dinner', eat: 'dinner',
  coffee: 'coffee', cafe: 'coffee', cowork: 'coffee',
  gym: 'gym', workout: 'gym', lift: 'gym',
  chill: 'chill', hang: 'chill', hangout: 'chill', movie: 'chill',
  travel: 'travel', trip: 'travel', road: 'travel',
  padel: 'padel', tennis: 'padel',
};

function parseLobText(text: string): ParsedLob {
  const lower = text.toLowerCase();
  let category: LobCategory | '' = '';
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) { category = cat; break; }
  }

  // Extract time patterns like "8pm", "7:30pm", "tonight", "tomorrow"
  const timeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/);
  const time = timeMatch ? timeMatch[1] : '';

  // Use first group as default
  const groupId = groups[0]?.id || '';

  return { title: text, category, time, location: '', groupId };
}

interface LobComposerProps {
  open: boolean;
  onClose: () => void;
  onLobSent: () => void;
}

export function LobComposer({ open, onClose, onLobSent }: LobComposerProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ComposerStep>('quick');
  const [quickText, setQuickText] = useState('');
  const [parsed, setParsed] = useState<ParsedLob>({ title: '', category: '', time: '', location: '', groupId: groups[0]?.id || '' });
  const [showConfirm, setShowConfirm] = useState(false);

  // Drag to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0.3]);

  useEffect(() => {
    if (open) {
      setStep('quick');
      setQuickText('');
      setParsed({ title: '', category: '', time: '', location: '', groupId: groups[0]?.id || '' });
      setShowConfirm(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleQuickSubmit = useCallback(() => {
    if (!quickText.trim()) return;
    const result = parseLobText(quickText);
    setParsed(result);
    if (result.category) {
      setShowConfirm(true);
    } else {
      setStep('category');
    }
  }, [quickText]);

  const handleLobIt = useCallback(() => {
    onLobSent();
    onClose();
  }, [onLobSent, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) onClose();
  };

  const selectedGroup = groups.find(g => g.id === parsed.groupId);
  const catConfig = parsed.category ? CATEGORY_CONFIG[parsed.category] : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border border-border/50 shadow-card overflow-hidden max-h-[85vh]">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-5 pb-6 overflow-y-auto max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-foreground">
                    {step === 'quick' && !showConfirm && '🏐 Lob an idea'}
                    {showConfirm && '🎯 Looks good?'}
                    {step === 'group' && 'Who\'s in?'}
                    {step === 'category' && 'What\'s the plan?'}
                    {step === 'time' && 'When?'}
                    {step === 'location' && 'Where?'}
                    {step === 'review' && 'Review'}
                  </h2>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {/* QUICK INPUT MODE */}
                  {step === 'quick' && !showConfirm && (
                    <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Quick input */}
                      <div className="relative mb-4">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="Hoops 8pm DHA..."
                          value={quickText}
                          onChange={e => setQuickText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleQuickSubmit()}
                          className="w-full p-4 pr-12 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {quickText && (
                          <button
                            onClick={handleQuickSubmit}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center"
                          >
                            <Send className="w-4 h-4 text-primary-foreground" />
                          </button>
                        )}
                      </div>

                      {/* Templates */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Quick templates
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TEMPLATES.map(t => (
                            <button
                              key={t.text}
                              onClick={() => { setQuickText(t.text); }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/80 border border-border/50 text-sm text-foreground hover:border-primary/50 transition-colors"
                            >
                              <span>{t.emoji}</span>
                              <span className="font-medium">{t.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Group selector */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Send to</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {groups.map(g => (
                            <button
                              key={g.id}
                              onClick={() => setParsed(p => ({ ...p, groupId: g.id }))}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                                parsed.groupId === g.id
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border bg-secondary/50 text-muted-foreground'
                              }`}
                            >
                              <span>{g.emoji}</span>
                              {g.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Or use assisted flow */}
                      <button
                        onClick={() => setStep('group')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50 text-sm text-muted-foreground mt-2"
                      >
                        <span>Build step by step instead</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* CONFIRMATION (after quick parse) */}
                  {showConfirm && (
                    <motion.div key="confirm" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <div className="gradient-card rounded-2xl p-5 border border-border/50 mb-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{catConfig?.emoji || '📌'}</span>
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{parsed.title}</h3>
                            <p className="text-sm text-muted-foreground">{selectedGroup?.name}</p>
                          </div>
                        </div>
                        {parsed.time && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{parsed.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Quorum: {catConfig?.defaultQuorum || 2} needed</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowConfirm(false); setStep('category'); }}
                          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm"
                        >
                          Edit
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleLobIt}
                          className="flex-[2] py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-glow"
                        >
                          🏐 Lob It!
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ASSISTED: Group select */}
                  {step === 'group' && (
                    <motion.div key="group" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="space-y-2">
                        {groups.map(g => (
                          <button
                            key={g.id}
                            onClick={() => { setParsed(p => ({ ...p, groupId: g.id })); setStep('category'); }}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                              parsed.groupId === g.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/50 hover:border-primary/50'
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
                    </motion.div>
                  )}

                  {/* ASSISTED: Category */}
                  {step === 'category' && (
                    <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {(Object.entries(CATEGORY_CONFIG) as [LobCategory, typeof CATEGORY_CONFIG[LobCategory]][]).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setParsed(p => ({ ...p, category: key, title: p.title || val.label }));
                            }}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                              parsed.category === key ? 'border-primary bg-primary/10' : 'border-border bg-secondary/50 hover:border-primary/50'
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
                        value={parsed.title}
                        onChange={e => setParsed(p => ({ ...p, title: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => setStep('time')}
                        disabled={!parsed.category || !parsed.title}
                        className="w-full mt-3 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
                      >
                        Next
                      </button>
                    </motion.div>
                  )}

                  {/* ASSISTED: Time */}
                  {step === 'time' && (
                    <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                          <input
                            type="date"
                            onChange={e => setParsed(p => ({ ...p, time: e.target.value + (p.time.includes('T') ? p.time.slice(10) : '') }))}
                            className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
                          <input
                            type="time"
                            onChange={e => setParsed(p => ({ ...p, time: (p.time.slice(0, 10) || new Date().toISOString().slice(0, 10)) + 'T' + e.target.value }))}
                            className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setStep('location')}
                        className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                      >
                        Next
                      </button>
                    </motion.div>
                  )}

                  {/* ASSISTED: Location */}
                  {step === 'location' && (
                    <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="relative mb-4">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search a place..."
                          value={parsed.location}
                          onChange={e => setParsed(p => ({ ...p, location: e.target.value }))}
                          className="w-full p-3 pl-9 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLobIt}
                        className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-glow"
                      >
                        🏐 Lob It!
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
