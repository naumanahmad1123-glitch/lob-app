import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { X, MapPin, Users, ChevronRight, User, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_CONFIG, LobCategory } from '@/data/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { useQueryClient } from '@tanstack/react-query';

type ComposerStep = 'quick' | 'build';
type RecipientType = 'group' | 'individuals';

interface ParsedLob {
  title: string;
  category: LobCategory | '';
  time: string;
  location: string;
  locationAddress: string;
  locationLat: number | null;
  locationLng: number | null;
  groupId: string;
  recipientType: RecipientType;
  selectedUserIds: string[];
}

const SUGGESTIONS = [
  'Pickup basketball 🏀',
  'Grab dinner 🍽️',
  'Coffee ☕',
  'Watch the game 📺',
  'Beach day 🏖️',
  'Hike 🥾',
  'Movie night 🎬',
  'Game night 🎲',
];

const inferCategory = (title: string): { category: LobCategory | ''; emoji: string } => {
  const t = title.toLowerCase();
  if (/padel/i.test(t))
    return { category: 'padel', emoji: CATEGORY_CONFIG.padel.emoji };
  if (/basketball|soccer|football|tennis|golf|run|surf|ski|climb|yoga|swim|workout|pickleball|volleyball/i.test(t))
    return { category: 'sports', emoji: CATEGORY_CONFIG.sports.emoji };
  if (/gym|lift|weights/i.test(t))
    return { category: 'gym', emoji: CATEGORY_CONFIG.gym.emoji };
  if (/dinner|lunch|brunch|breakfast|drinks|bar|restaurant|eat|food|taco|pizza|sushi|bbq/i.test(t))
    return { category: 'dinner', emoji: CATEGORY_CONFIG.dinner.emoji };
  if (/coffee|café|cafe/i.test(t))
    return { category: 'coffee', emoji: CATEGORY_CONFIG.coffee.emoji };
  if (/beach|lake|park|camp|hike|road trip|travel|explore|adventure|outdoor|trip/i.test(t))
    return { category: 'travel', emoji: CATEGORY_CONFIG.travel.emoji };
  if (/chill|hang|movie|film|concert|game night|karaoke|study|cowork/i.test(t))
    return { category: 'chill', emoji: CATEGORY_CONFIG.chill.emoji };
  return { category: '', emoji: '' };
};

interface ConnectionInfo {
  user_id: string;
  name: string;
  avatar: string;
}

interface LobComposerProps {
  open: boolean;
  onClose: () => void;
  onLobSent: () => void;
  prefillText?: string;
  prefillUserIds?: string[];
}

export function LobComposer({ open, onClose, onLobSent, prefillText, prefillUserIds }: LobComposerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dbGroups = [] } = useSupabaseGroups();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ComposerStep>('quick');
  const [quickText, setQuickText] = useState('');
  const [parsed, setParsed] = useState<ParsedLob>({ title: '', category: '', time: '', location: '', locationAddress: '', locationLat: null, locationLng: null, groupId: '', recipientType: 'group', selectedUserIds: [] });
  const [sending, setSending] = useState(false);
  const [buildQuorum, setBuildQuorum] = useState(2);
  const [buildDate, setBuildDate] = useState('');
  const [buildTime, setBuildTime] = useState('');

  // Fetch connections (people sharing groups with current user)
  const connections = useMemo<ConnectionInfo[]>(() => {
    if (!user) return [];
    const friendMap = new Map<string, ConnectionInfo>();
    dbGroups.forEach(g => {
      const iAmMember = g.members.some((m: any) => m.user_id === user.id);
      if (!iAmMember) return;
      g.members.forEach((m: any) => {
        if (m.user_id === user.id) return;
        if (!friendMap.has(m.user_id)) {
          friendMap.set(m.user_id, { user_id: m.user_id, name: m.name || 'Unknown', avatar: m.avatar || '🙂' });
        }
      });
    });
    return Array.from(friendMap.values());
  }, [dbGroups, user]);

  const sheetY = useMotionValue(0);
  const dragProgress = useTransform(sheetY, [0, -200], [0, 1]);
  const cardRotate = useTransform(sheetY, [0, -200], [0, -8]);
  const cardScale = useTransform(sheetY, [0, -100, -200], [1, 1.02, 0.95]);
  const stampOpacity = useTransform(sheetY, [0, -80, -150], [0, 0, 1]);
  const stampScale = useTransform(sheetY, [0, -80, -150], [0.5, 0.5, 1]);
  const glowOpacity = useTransform(sheetY, [0, -80, -180], [0, 0, 0.6]);
  const bgHue = useTransform(sheetY, [0, -200], [0, 120]); // shift toward green
  const isNearThreshold = useTransform(sheetY, [-300, -150, 0], [1, 1, 0]);

  useEffect(() => {
    if (open) {
      setStep('quick');
      const initial = prefillText || '';
      setQuickText(initial);
      const hasPrefillUsers = prefillUserIds && prefillUserIds.length > 0;
      setParsed({
        title: '',
        category: '',
        time: '',
        location: '',
        locationAddress: '',
        locationLat: null,
        locationLng: null,
        groupId: hasPrefillUsers ? '' : (dbGroups[0]?.id || ''),
        recipientType: hasPrefillUsers ? 'individuals' : 'group',
        selectedUserIds: hasPrefillUsers ? prefillUserIds : [],
      });
      setSending(false);
      setBuildQuorum(2);
      setBuildDate('');
      setBuildTime('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, prefillText, prefillUserIds, dbGroups]);

  const handleQuickLobIt = useCallback(async () => {
    if (!user || sending || !quickText.trim()) return;
    const isIndividual = parsed.recipientType === 'individuals';
    const groupId = !isIndividual && parsed.groupId ? parsed.groupId : null;
    if (!groupId && (!isIndividual || parsed.selectedUserIds.length === 0)) return;
    setSending(true);
    const group = dbGroups.find(g => g.id === groupId);
    const { category: inferredCategory } = inferCategory(quickText);

    try {
      const { data: lobData, error: lobError } = await supabase
        .from('lobs')
        .insert({
          title: quickText.trim(),
          category: inferredCategory || 'other',
          group_id: groupId,
          group_name: group?.name || null,
          created_by: user.id,
          location: null,
          location_name: null,
          location_address: null,
          location_lat: null,
          location_lng: null,
          quorum: 2,
          status: 'voting',
          when_mode: 'specific',
        })
        .select('id')
        .single();

      if (lobError) throw lobError;

      await supabase.from('lob_responses').insert({
        lob_id: lobData.id,
        user_id: user.id,
        response: 'in',
      });

      if (isIndividual && parsed.selectedUserIds.length > 0) {
        await supabase.from('lob_recipients').insert(
          parsed.selectedUserIds.map(uid => ({ lob_id: lobData.id, user_id: uid }))
        );
      }

      queryClient.invalidateQueries({ queryKey: ['supabase-lobs'] });
      onLobSent();
      onClose();
      navigate(`/lob/${lobData.id}`);
    } catch (err: any) {
      console.error('Failed to create lob:', err);
      setSending(false);
    }
  }, [quickText, parsed, user, sending, dbGroups, onLobSent, onClose, navigate, queryClient]);

  const handleBuildLobIt = useCallback(async () => {
    if (!user || sending || !parsed.title.trim()) return;
    setSending(true);
    const category = (parsed.category || 'other') as LobCategory;
    const WHEN_CHIPS = ['Today', 'Tomorrow', 'This week', 'Next week'];
    let timeIso: string | undefined;
    if (parsed.time && !WHEN_CHIPS.includes(parsed.time)) {
      // Freeform text — store as-is in the time field
      timeIso = parsed.time;
    } else if (parsed.time === 'Today') {
      const d = new Date(); d.setHours(12, 0, 0, 0);
      timeIso = d.toISOString();
    } else if (parsed.time === 'Tomorrow') {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0);
      timeIso = d.toISOString();
    } else if (parsed.time === 'This week') {
      timeIso = 'This week';
    } else if (parsed.time === 'Next week') {
      timeIso = 'Next week';
    } else if (buildDate) {
      timeIso = buildTime ? new Date(`${buildDate}T${buildTime}`).toISOString() : new Date(buildDate).toISOString();
    } else {
      timeIso = undefined;
    }
    const isIndividual = parsed.recipientType === 'individuals';
    const groupId = !isIndividual && parsed.groupId ? parsed.groupId : null;
    const group = dbGroups.find(g => g.id === groupId);

    try {
      const { data: lobData, error: lobError } = await supabase
        .from('lobs')
        .insert({
          title: parsed.title.trim(),
          category,
          group_id: groupId,
          group_name: group?.name || null,
          created_by: user.id,
          location: parsed.location || null,
          location_name: parsed.location || null,
          location_address: parsed.locationAddress || null,
          location_lat: parsed.locationLat,
          location_lng: parsed.locationLng,
          quorum: buildQuorum,
          status: 'voting',
          when_mode: 'specific',
        })
        .select('id')
        .single();

      if (lobError) throw lobError;

      if (timeIso) await supabase.from('lob_time_options').insert({ lob_id: lobData.id, datetime: timeIso });
      await supabase.from('lob_responses').insert({ lob_id: lobData.id, user_id: user.id, response: 'in' });

      if (isIndividual && parsed.selectedUserIds.length > 0) {
        await supabase.from('lob_recipients').insert(
          parsed.selectedUserIds.map(uid => ({ lob_id: lobData.id, user_id: uid }))
        );
      }

      queryClient.invalidateQueries({ queryKey: ['supabase-lobs'] });
      onLobSent();
      onClose();
      navigate('/');
    } catch (err: any) {
      console.error('Failed to create lob:', err);
    } finally {
      setSending(false);
    }
  }, [parsed, user, sending, dbGroups, buildQuorum, buildDate, buildTime, onLobSent, onClose, navigate, queryClient]);

  const toggleUser = (uid: string) => {
    setParsed(p => ({
      ...p,
      selectedUserIds: p.selectedUserIds.includes(uid)
        ? p.selectedUserIds.filter(id => id !== uid)
        : [...p.selectedUserIds, uid],
    }));
  };

  // Auto-infer category from title
  useEffect(() => {
    if (parsed.title) {
      const { category } = inferCategory(parsed.title);
      if (category) setParsed(p => ({ ...p, category }));
    }
  }, [parsed.title]);

  const hasValidRecipient = parsed.recipientType === 'group' ? !!parsed.groupId : parsed.selectedUserIds.length > 0;
  const quickCardReady = !!quickText.trim() && hasValidRecipient;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag='y'
            dragConstraints={{ bottom: 100 }}
            dragMomentum={false}
            onDragEnd={(_: any, info: PanInfo) => {
              if (info.offset.y > 100) { onClose(); return; }
              if (step === 'quick' && quickCardReady && (info.offset.y < -80 || info.velocity.y < -400)) {
                // Animate sheet flying off screen upward, then trigger lob
                animate(sheetY, -800, {
                  type: 'tween',
                  duration: 0.25,
                  ease: [0.2, 0, 0.8, 1]
                }).then(() => {
                  handleQuickLobIt();
                });
              } else if (info.offset.y < -80 && !(step === 'quick' && quickCardReady)) {
                // Snap back if not ready
                animate(sheetY, 0, { type: 'spring', stiffness: 400, damping: 30 });
              }
            }}
            style={{ y: sheetY }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border border-border/50 shadow-card overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex justify-center pt-3 pb-1">
                {step === 'quick' && quickCardReady ? (
                  <motion.p
                    style={{ opacity: isNearThreshold }}
                    className="text-[11px] font-semibold text-primary animate-pulse"
                  >
                    ↑ Swipe up to lob it
                  </motion.p>
                ) : (
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              <div className="flex-1 px-5 pb-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {step === 'build' && (
                      <button onClick={() => setStep('quick')} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <h2 className="text-lg font-extrabold text-foreground">
                      {step === 'quick' && '🏐 Lob an idea'}
                      {step === 'build' && '🏗️ Build a lob'}
                    </h2>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {step === 'quick' && (
                    <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Title input */}
                      <div className="mb-4">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="What's the plan?"
                          value={quickText}
                          onChange={e => setQuickText(e.target.value)}
                          className="w-full p-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Quick suggestions */}
                      {!quickText.trim() && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {SUGGESTIONS.map(s => (
                            <button
                              key={s}
                              onClick={() => setQuickText(s)}
                              className="px-3 py-1.5 rounded-full bg-secondary/80 border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-95"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Send to */}
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Send to</p>
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => setParsed(p => ({ ...p, recipientType: 'group', selectedUserIds: [] }))}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                              parsed.recipientType === 'group'
                                ? 'gradient-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary/80 text-muted-foreground border border-border/50 hover:border-primary/30'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Group
                          </button>
                          <button
                            onClick={() => setParsed(p => ({ ...p, recipientType: 'individuals', groupId: '' }))}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                              parsed.recipientType === 'individuals'
                                ? 'gradient-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary/80 text-muted-foreground border border-border/50 hover:border-primary/30'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                            People
                          </button>
                        </div>

                        {parsed.recipientType === 'group' && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {dbGroups.map(g => (
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
                            {dbGroups.length === 0 && (
                              <p className="text-xs text-muted-foreground">Create a group first to send lobs</p>
                            )}
                          </div>
                        )}

                        {parsed.recipientType === 'individuals' && (
                          <div>
                            {connections.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Join a group to find connections</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {connections.map(c => {
                                  const isSelected = parsed.selectedUserIds.includes(c.user_id);
                                  return (
                                    <button
                                      key={c.user_id}
                                      onClick={() => toggleUser(c.user_id)}
                                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                        isSelected
                                          ? 'border-primary bg-primary/10 text-foreground'
                                          : 'border-border bg-secondary/50 text-muted-foreground'
                                      }`}
                                    >
                                      <span className="text-base">{c.avatar}</span>
                                      <span>{c.name.split(' ')[0]}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Build step by step link */}
                      <button
                        onClick={() => {
                          setParsed(p => ({ ...p, title: quickText || p.title }));
                          setBuildDate('');
                          setBuildTime('');
                          setBuildQuorum(2);
                          setStep('build');
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                      >
                        <span>Build step by step</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {step === 'build' && (
                    <motion.div key="build" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {/* Title */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
                        <input
                          type="text"
                          placeholder="What's the plan?"
                          value={parsed.title}
                          onChange={e => setParsed(p => ({ ...p, title: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                      </div>

                      {/* When — optional */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">When <span className="font-normal">(optional)</span></label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {['Today', 'Tomorrow', 'This week', 'Next week'].map(chip => {
                            const isActive = parsed.time === chip;
                            return (
                              <button
                                key={chip}
                                onClick={() => {
                                  setParsed(p => ({ ...p, time: isActive ? '' : chip }));
                                  setBuildDate('');
                                  setBuildTime('');
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                                  isActive
                                    ? 'gradient-primary text-primary-foreground shadow-sm'
                                    : 'bg-secondary/80 text-muted-foreground border border-border/50 hover:border-primary/30'
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          placeholder="Or type a time, e.g. Saturday 7pm"
                          value={parsed.time && !['Today', 'Tomorrow', 'This week', 'Next week'].includes(parsed.time) ? parsed.time : ''}
                          onChange={e => {
                            setParsed(p => ({ ...p, time: e.target.value }));
                            setBuildDate('');
                            setBuildTime('');
                          }}
                          className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Where — optional */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Where <span className="font-normal">(optional)</span></label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Add a location"
                            value={parsed.location}
                            onChange={e => setParsed(p => ({ ...p, location: e.target.value }))}
                            className="w-full p-3 pl-9 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Quorum stepper */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">People needed</label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setBuildQuorum(q => Math.max(1, q - 1))}
                            className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold text-foreground cursor-pointer active:scale-95 transition-transform"
                          >−</button>
                          <span className="text-2xl font-bold text-foreground w-8 text-center">{buildQuorum}</span>
                          <button
                            onClick={() => setBuildQuorum(q => Math.min(20, q + 1))}
                            className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold text-foreground cursor-pointer active:scale-95 transition-transform"
                          >+</button>
                        </div>
                      </div>

                      {/* Send to */}
                      <div className="mb-6">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Send to</label>
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => setParsed(p => ({ ...p, recipientType: 'group', selectedUserIds: [] }))}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${parsed.recipientType === 'group' ? 'gradient-primary text-primary-foreground shadow-sm' : 'bg-secondary/80 text-muted-foreground border border-border/50'}`}
                          >
                            <Users className="w-3.5 h-3.5" /> Group
                          </button>
                          <button
                            onClick={() => setParsed(p => ({ ...p, recipientType: 'individuals', groupId: '' }))}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${parsed.recipientType === 'individuals' ? 'gradient-primary text-primary-foreground shadow-sm' : 'bg-secondary/80 text-muted-foreground border border-border/50'}`}
                          >
                            <User className="w-3.5 h-3.5" /> People
                          </button>
                        </div>
                        {parsed.recipientType === 'group' && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {dbGroups.map(g => (
                              <button
                                key={g.id}
                                onClick={() => setParsed(p => ({ ...p, groupId: g.id }))}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${parsed.groupId === g.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}
                              >
                                <span>{g.emoji}</span>{g.name}
                              </button>
                            ))}
                            {dbGroups.length === 0 && <p className="text-xs text-muted-foreground py-2">Create a group first</p>}
                          </div>
                        )}
                        {parsed.recipientType === 'individuals' && (
                          <div className="flex flex-wrap gap-2">
                            {connections.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Join a group to find connections</p>
                            ) : connections.map(c => {
                              const isSelected = parsed.selectedUserIds.includes(c.user_id);
                              return (
                                <button
                                  key={c.user_id}
                                  onClick={() => toggleUser(c.user_id)}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${isSelected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}
                                >
                                  <span className="text-base">{c.avatar}</span>
                                  <span>{c.name.split(' ')[0]}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Lob it */}
                      <button
                        onClick={handleBuildLobIt}
                        disabled={!parsed.title.trim() || sending || !hasValidRecipient}
                        className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-40 cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        {sending ? 'Lobbing...' : '🏐 Lob it'}
                      </button>
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
