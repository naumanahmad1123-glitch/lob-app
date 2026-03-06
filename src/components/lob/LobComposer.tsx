import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, MapPin, Clock, Users, ChevronRight, Sparkles, Send, User, Check, ChevronUp, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { groups, users, currentUser } from '@/data/seed';
import { CATEGORY_CONFIG, LobCategory, Lob } from '@/data/types';
import { lobStore } from '@/stores/lobStore';
import { usePersonalizedVibes, detectVibeFromChips } from '@/hooks/usePersonalizedVibes';
import { CATEGORY_KEYWORDS, parseTimeToISO, detectCategory } from '@/lib/lob-utils';

type ComposerStep = 'quick' | 'recipients' | 'category' | 'time' | 'location' | 'review';
type RecipientType = 'group' | 'individuals';

interface ParsedLob {
  title: string;
  category: LobCategory | '';
  time: string;
  location: string;
  groupId: string;
  recipientType: RecipientType;
  selectedUserIds: string[];
}

const DEFAULT_TEMPLATES = [
  { text: 'Hoops', emoji: '🏀' },
  { text: 'Coffee', emoji: '☕' },
  { text: 'Dinner', emoji: '🍽️' },
  { text: 'Drinks', emoji: '🍹' },
  { text: 'Gym', emoji: '💪' },
];

function parseLobText(text: string): ParsedLob {
  const lower = text.toLowerCase();
  const category = detectCategory(text);

  // Extract time patterns like "8pm", "7:30pm"
  const timeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/);
  const rawTime = timeMatch ? timeMatch[1] : '';

  // Extract day references
  const dayMatch = lower.match(/(tonight|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  const rawDay = dayMatch ? dayMatch[1] : 'today';

  const time = rawTime ? parseTimeToISO(rawTime, rawDay) : '';

  const groupId = groups[0]?.id || '';

  return { title: text, category, time, location: '', groupId, recipientType: 'group' as RecipientType, selectedUserIds: [] };
}

function SwipeableCard({ onLob, card }: { onLob: () => void; card: React.ReactNode }) {
  const cardY = useMotionValue(0);
  const cardOpacity = useTransform(cardY, [0, -120], [1, 0.3]);
  const cardScale = useTransform(cardY, [0, -120], [1, 0.92]);
  const hintOp = useTransform(cardY, [0, -30], [1, 0]);
  const [launched, setLaunched] = useState(false);

  const onDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < -60 || info.velocity.y < -300) {
      setLaunched(true);
    }
  }, []);

  useEffect(() => {
    if (launched) {
      const t = setTimeout(() => { onLob(); setLaunched(false); }, 500);
      return () => clearTimeout(t);
    }
  }, [launched, onLob]);

  if (launched) {
    return (
      <div className="relative h-36 flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -300, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="gradient-card rounded-2xl p-5 border border-border/50 w-full"
        >
          {card}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative select-none">
      <motion.div
        drag="y"
        dragConstraints={{ top: -150, bottom: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{ y: cardY, opacity: cardOpacity, scale: cardScale }}
        whileTap={{ cursor: 'grabbing' }}
        className="gradient-card rounded-2xl p-5 border border-border/50 cursor-grab"
      >
        {card}
      </motion.div>
      <motion.p
        style={{ opacity: hintOp }}
        className="text-center text-[11px] font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-1"
      >
        <ChevronUp className="w-3.5 h-3.5" /> Swipe card up to lob it
      </motion.p>
    </div>
  );
}

interface LobComposerProps {
  open: boolean;
  onClose: () => void;
  onLobSent: () => void;
  prefillText?: string;
}

export function LobComposer({ open, onClose, onLobSent, prefillText }: LobComposerProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ComposerStep>('quick');
  const [quickText, setQuickText] = useState('');
  const [parsed, setParsed] = useState<ParsedLob>({ title: '', category: '', time: '', location: '', groupId: groups[0]?.id || '', recipientType: 'group', selectedUserIds: [] });
  const [showConfirm, setShowConfirm] = useState(false);

  // Personalized vibes & templates
  const vibeChips = usePersonalizedVibes(currentUser.id);
  const templates = useMemo(() => {
    if (vibeChips.length === 0) return DEFAULT_TEMPLATES;
    return vibeChips.slice(0, 5).map(c => ({
      text: c.title,
      emoji: c.label.split(' ')[0] || '📌',
    }));
  }, [vibeChips]);

  // Drag to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0.3]);

  useEffect(() => {
    if (open) {
      setStep('quick');
      const initial = prefillText || '';
      setQuickText(initial);
      setParsed({ title: '', category: '', time: '', location: '', groupId: groups[0]?.id || '', recipientType: 'group', selectedUserIds: [] });
      setShowConfirm(false);
      setLobLaunched(false);
      confirmDragY.set(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, prefillText]);

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
    const category = (parsed.category || 'other') as LobCategory;
    const catConfig = CATEGORY_CONFIG[category];
    const timeIso = parsed.time || new Date().toISOString();
    const groupIds = parsed.recipientType === 'group' && parsed.groupId
      ? [parsed.groupId]
      : [];

    const targets = groupIds.length > 0 ? groupIds : [''];
    targets.forEach((gId, idx) => {
      const group = groups.find(g => g.id === gId);
      const newLob: Lob = {
        id: `user-lob-${Date.now()}-${idx}`,
        title: parsed.title,
        category,
        groupId: gId,
        groupName: group?.name || 'Friends',
        createdBy: currentUser.id,
        location: parsed.location || undefined,
        timeOptions: [{ id: `to-${Date.now()}-${idx}`, datetime: timeIso, votes: [currentUser.id] }],
        quorum: catConfig.defaultQuorum,
        status: 'voting',
        responses: [{ userId: currentUser.id, response: 'in' }],
        createdAt: new Date().toISOString(),
      };
      lobStore.addLob(newLob);
    });

    onLobSent();
    onClose();
    navigate('/');
  }, [parsed, onLobSent, onClose, navigate]);

  // Confirm-mode swipe
  const confirmDragY = useMotionValue(0);
  const confirmOpacity = useTransform(confirmDragY, [0, -120], [1, 0.3]);
  const confirmScale = useTransform(confirmDragY, [0, -120], [1, 0.92]);
  const confirmHintOp = useTransform(confirmDragY, [0, -30], [1, 0]);
  const [lobLaunched, setLobLaunched] = useState(false);

  const handleConfirmDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < -60 || info.velocity.y < -300) {
      setLobLaunched(true);
      setTimeout(() => {
        handleLobIt();
        setLobLaunched(false);
      }, 500);
    }
  }, [handleLobIt]);

  const selectedGroup = parsed.recipientType === 'group' ? groups.find(g => g.id === parsed.groupId) : null;
  const otherUsers = users.filter(u => u.id !== currentUser.id);
  const selectedIndividuals = otherUsers.filter(u => parsed.selectedUserIds.includes(u.id));
  const recipientLabel = parsed.recipientType === 'group'
    ? selectedGroup?.name || 'a group'
    : selectedIndividuals.map(u => u.name).join(', ') || 'friends';
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
            animate={lobLaunched ? { y: '-100%', opacity: 0, scale: 0.8 } : { y: 0 }}
            exit={{ y: '100%' }}
            transition={lobLaunched ? { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } : { type: 'spring', damping: 28, stiffness: 300 }}
            drag={showConfirm ? 'y' : 'y'}
            dragConstraints={showConfirm ? { top: -200, bottom: 100 } : { top: 0 }}
            dragElastic={0.2}
            onDragEnd={showConfirm ? handleConfirmDragEnd : ((_: any, info: PanInfo) => { if (info.offset.y > 100) onClose(); })}
            style={showConfirm ? { y: confirmDragY, opacity: confirmOpacity, scale: confirmScale } : { y, opacity }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border border-border/50 shadow-card overflow-hidden max-h-[85vh]">
              {/* Lob arrow indicator */}
              {showConfirm && !lobLaunched && (
                <motion.div
                  style={{ opacity: confirmHintOp }}
                  className="flex justify-center pt-4 pb-1"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  >
                    <ArrowUp className="w-6 h-6 text-primary" strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
              )}
              {showConfirm && lobLaunched && (
                <div className="flex justify-center pt-4 pb-1">
                  <motion.div
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -80, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ArrowUp className="w-6 h-6 text-primary" strokeWidth={2.5} />
                  </motion.div>
                </div>
              )}
              {/* Handle */}
              {!showConfirm && (
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              )}

              <div className="px-5 pb-6 overflow-y-auto max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-foreground">
                    {step === 'quick' && !showConfirm && '🏐 Lob an idea'}
                    {showConfirm && '🎯 Looks good?'}
                    {step === 'recipients' && 'Who\'s in?'}
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
                          {templates.map(t => (
                            <button
                              key={t.text}
                              onClick={() => {
                                setQuickText(t.text);
                                const detected = detectVibeFromChips(t.text, vibeChips);
                                if (detected) {
                                  const chip = vibeChips.find(c => c.title === detected);
                                  if (chip) {
                                    setParsed(p => ({ ...p, category: chip.category }));
                                  }
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/80 border border-border/50 text-sm text-foreground hover:border-primary/50 transition-colors"
                            >
                              <span>{t.emoji}</span>
                              <span className="font-medium">{t.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Recipient selector */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Send to</p>
                        {/* Toggle */}
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => setParsed(p => ({ ...p, recipientType: 'group', selectedUserIds: [] }))}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              parsed.recipientType === 'group' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <Users className="w-3 h-3" />Group
                          </button>
                          <button
                            onClick={() => setParsed(p => ({ ...p, recipientType: 'individuals', groupId: '' }))}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              parsed.recipientType === 'individuals' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <User className="w-3 h-3" />People
                          </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {parsed.recipientType === 'group' ? (
                            groups.map(g => (
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
                            ))
                          ) : (
                            otherUsers.map(u => {
                              const sel = parsed.selectedUserIds.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  onClick={() => setParsed(p => ({
                                    ...p,
                                    selectedUserIds: sel
                                      ? p.selectedUserIds.filter(id => id !== u.id)
                                      : [...p.selectedUserIds, u.id]
                                  }))}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                                    sel
                                      ? 'border-primary bg-primary/10 text-foreground'
                                      : 'border-border bg-secondary/50 text-muted-foreground'
                                  }`}
                                >
                                  <span>{u.avatar}</span>
                                  {u.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
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
                            <p className="text-sm text-muted-foreground">{recipientLabel}</p>
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
                          <span>{catConfig?.defaultQuorum || 2} to make it happen</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => { setShowConfirm(false); setStep('category'); }}
                          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm"
                        >
                          Edit
                        </button>
                      </div>

                      <motion.p
                        style={{ opacity: confirmHintOp }}
                        className="text-center text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1"
                      >
                        <ChevronUp className="w-3.5 h-3.5" /> Swipe up to lob it
                      </motion.p>
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
                      <SwipeableCard
                        onLob={handleLobIt}
                        card={
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{catConfig?.emoji || '📌'}</span>
                            <div>
                              <p className="font-bold text-foreground">{parsed.title}</p>
                              <p className="text-xs text-muted-foreground">{recipientLabel}</p>
                            </div>
                          </div>
                        }
                      />
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
