import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Globe, Lock, Users, User, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type TripType = 'solo' | 'group';
type Visibility = 'broadcast' | 'people' | 'groups';
type GroupMode = 'defined' | 'dates-open' | 'fully-open';
type RecipientType = 'group' | 'individuals';

const WHY_TAGS = ['Work', 'Holiday', 'Family', 'Event', 'Passing through'];

interface TripComposerProps {
  open: boolean;
  onClose: () => void;
}

interface ConnectionInfo {
  user_id: string;
  name: string;
  avatar: string;
}

export function TripComposer({ open, onClose }: TripComposerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: dbGroups = [] } = useSupabaseGroups();

  const [tripType, setTripType] = useState<TripType | null>(null);
  const [saving, setSaving] = useState(false);

  // Solo state
  const [soloCity, setSoloCity] = useState('');
  const [soloCountry, setSoloCountry] = useState('');
  const [soloStart, setSoloStart] = useState('');
  const [soloEnd, setSoloEnd] = useState('');
  const [whyTags, setWhyTags] = useState<string[]>([]);
  const [whyNote, setWhyNote] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('broadcast');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('group');

  // Group state
  const [groupMode, setGroupMode] = useState<GroupMode>('defined');
  const [groupCity, setGroupCity] = useState('');
  const [groupStart, setGroupStart] = useState('');
  const [groupEnd, setGroupEnd] = useState('');
  const [groupTimeframe, setGroupTimeframe] = useState('');
  const [groupHeadcount, setGroupHeadcount] = useState(4);
  const [groupRecipientType, setGroupRecipientType] = useState<RecipientType>('group');
  const [groupSelectedGroupId, setGroupSelectedGroupId] = useState('');
  const [groupSelectedUserIds, setGroupSelectedUserIds] = useState<string[]>([]);

  const connections = useMemo<ConnectionInfo[]>(() => {
    if (!user) return [];
    const map = new Map<string, ConnectionInfo>();
    dbGroups.forEach(g => {
      if (!g.members.some((m: any) => m.user_id === user.id)) return;
      g.members.forEach((m: any) => {
        if (m.user_id === user.id) return;
        if (!map.has(m.user_id)) map.set(m.user_id, { user_id: m.user_id, name: m.name || 'Unknown', avatar: m.avatar || '🙂' });
      });
    });
    return Array.from(map.values());
  }, [dbGroups, user]);

  const reset = () => {
    setTripType(null);
    setSoloCity(''); setSoloCountry(''); setSoloStart(''); setSoloEnd('');
    setWhyTags([]); setWhyNote(''); setVisibility('broadcast');
    setSelectedUserIds([]); setSelectedGroupId(''); setRecipientType('group');
    setGroupMode('defined'); setGroupCity(''); setGroupStart(''); setGroupEnd('');
    setGroupTimeframe(''); setGroupHeadcount(4);
    setGroupRecipientType('group'); setGroupSelectedGroupId(''); setGroupSelectedUserIds([]);
    setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleTag = (tag: string) => setWhyTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  const toggleUser = (uid: string) => setSelectedUserIds(p => p.includes(uid) ? p.filter(id => id !== uid) : [...p, uid]);
  const toggleGroupUser = (uid: string) => setGroupSelectedUserIds(p => p.includes(uid) ? p.filter(id => id !== uid) : [...p, uid]);

  const handleSaveSolo = async () => {
    if (!user || saving) return;
    if (!soloCity.trim()) { toast.error('Add a destination'); return; }
    if (!soloStart || !soloEnd) { toast.error('Add travel dates'); return; }
    setSaving(true);
    try {
      const whyText = [whyTags.join(', '), whyNote].filter(Boolean).join(' — ') || null;
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        city: soloCity.trim(),
        country: soloCountry.trim() || '',
        emoji: '✈️',
        start_date: soloStart,
        end_date: soloEnd,
        show_on_profile: visibility === 'broadcast',
        notes: whyText,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      toast.success(`Trip to ${soloCity} shared! ✈️`);
      handleClose();
    } catch (err: any) {
      toast.error('Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!user || saving) return;
    if (groupMode === 'defined' && (!groupCity.trim() || !groupStart || !groupEnd)) { toast.error('Fill in destination and dates'); return; }
    if (groupMode === 'dates-open' && !groupCity.trim()) { toast.error('Add a destination'); return; }
    const hasRecipient = groupRecipientType === 'group' ? !!groupSelectedGroupId : groupSelectedUserIds.length > 0;
    if (!hasRecipient) { toast.error('Select who to share with'); return; }
    setSaving(true);
    try {
      const { data: tripData, error } = await supabase.from('groups_trips').insert({
        created_by: user.id,
        title: groupCity.trim() || 'Group Trip',
        planning_mode: groupMode,
        destination: groupCity.trim() || null,
        start_date: groupMode === 'defined' ? groupStart : null,
        end_date: groupMode === 'defined' ? groupEnd : null,
        timeframe: groupMode !== 'defined' ? groupTimeframe : null,
        headcount: groupHeadcount,
        status: 'voting',
        emoji: '🌍',
      }).select('id').single();
      if (error) throw error;
      await supabase.from('trip_members').insert({ trip_id: tripData.id, user_id: user.id, status: 'in' });
      if (groupRecipientType === 'individuals' && groupSelectedUserIds.length > 0) {
        await supabase.from('trip_members').insert(groupSelectedUserIds.map(uid => ({ trip_id: tripData.id, user_id: uid, status: 'invited' })));
      }
      queryClient.invalidateQueries({ queryKey: ['supabase-group-trips'] });
      toast.success(`Group trip lobbed! 🌍`);
      handleClose();
    } catch (err: any) {
      toast.error('Failed to create group trip');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[80] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50">
        <button
          onClick={tripType ? () => setTripType(null) : handleClose}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
        >
          {tripType ? <ArrowLeft className="w-5 h-5 text-foreground" /> : <X className="w-5 h-5 text-foreground" />}
        </button>
        <h1 className="text-lg font-extrabold text-foreground">
          {!tripType ? 'New Trip' : tripType === 'solo' ? '✈️ Solo Trip' : '🌍 Group Trip'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Solo vs Group */}
          {!tripType && (
            <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-muted-foreground mb-4">What kind of trip is this?</p>
              <div className="space-y-3">
                <button
                  onClick={() => setTripType('solo')}
                  className="w-full text-left p-4 rounded-2xl border border-border/50 bg-secondary/30 hover:border-primary/50 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✈️</span>
                    <div>
                      <p className="font-bold text-foreground">Solo trip</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Share your travel plans — let friends know you're coming</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setTripType('group')}
                  className="w-full text-left p-4 rounded-2xl border border-border/50 bg-secondary/30 hover:border-primary/50 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🌍</span>
                    <div>
                      <p className="font-bold text-foreground">Group trip</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Plan a trip with friends — get everyone to commit</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Solo flow */}
          {tripType === 'solo' && (
            <motion.div key="solo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {/* Destination */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Destination</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="City" value={soloCity} onChange={e => setSoloCity(e.target.value)} className="flex-1 p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
                  <input type="text" placeholder="Country" value={soloCountry} onChange={e => setSoloCountry(e.target.value)} className="w-28 p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Dates</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">From</label>
                    <input type="date" value={soloStart} onChange={e => setSoloStart(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">To</label>
                    <input type="date" value={soloEnd} onChange={e => setSoloEnd(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              {/* Why */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Why are you going? <span className="font-normal">(optional)</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {WHY_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${whyTags.includes(tag) ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border/50'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Add a note (e.g. free evenings, staying an extra week)" value={whyNote} onChange={e => setWhyNote(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Visibility */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Who can see this?</label>
                <div className="space-y-2">
                  {([
                    { key: 'broadcast', icon: Globe, label: 'Broadcast', sub: 'All your connections' },
                    { key: 'people', icon: User, label: 'Specific people', sub: 'Choose who sees it' },
                    { key: 'groups', icon: Users, label: 'Specific groups', sub: 'Share with a group' },
                  ] as const).map(opt => (
                    <button key={opt.key} onClick={() => setVisibility(opt.key)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${visibility === opt.key ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                      <opt.icon className={`w-4 h-4 ${visibility === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.sub}</p>
                      </div>
                      {visibility === opt.key && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>

                {visibility === 'people' && connections.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {connections.map(c => (
                      <button key={c.user_id} onClick={() => toggleUser(c.user_id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${selectedUserIds.includes(c.user_id) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                        <span>{c.avatar}</span>
                        <span>{c.name.split(' ')[0]}</span>
                        {selectedUserIds.includes(c.user_id) && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}

                {visibility === 'groups' && (
                  <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
                    {dbGroups.map(g => (
                      <button key={g.id} onClick={() => setSelectedGroupId(g.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${selectedGroupId === g.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                        <span>{g.emoji}</span>{g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Group flow */}
          {tripType === 'group' && (
            <motion.div key="group" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {/* Mode */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">What stage is this trip at?</label>
                <div className="space-y-2">
                  {([
                    { key: 'defined', label: 'Destination + dates set', sub: 'Just need people to commit' },
                    { key: 'dates-open', label: 'Destination set, dates TBD', sub: 'Agree on when' },
                    { key: 'fully-open', label: 'Fully open', sub: 'Where and when TBD' },
                  ] as const).map(opt => (
                    <button key={opt.key} onClick={() => setGroupMode(opt.key)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${groupMode === opt.key ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.sub}</p>
                      </div>
                      {groupMode === opt.key && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              {groupMode !== 'fully-open' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Destination</label>
                  <input type="text" placeholder="City or country" value={groupCity} onChange={e => setGroupCity(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}

              {/* Dates */}
              {groupMode === 'defined' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Dates</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">From</label>
                      <input type="date" value={groupStart} onChange={e => setGroupStart(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">To</label>
                      <input type="date" value={groupEnd} onChange={e => setGroupEnd(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Timeframe */}
              {groupMode !== 'defined' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Rough timeframe</label>
                  <input type="text" placeholder="e.g. Sometime in August, Summer 2026" value={groupTimeframe} onChange={e => setGroupTimeframe(e.target.value)} className="w-full p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}

              {/* Headcount */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">People needed to confirm</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setGroupHeadcount(Math.max(2, groupHeadcount - 1))} className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold text-foreground active:scale-95 transition-transform">−</button>
                  <span className="text-2xl font-bold text-foreground w-8 text-center">{groupHeadcount}</span>
                  <button onClick={() => setGroupHeadcount(Math.min(20, groupHeadcount + 1))} className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold text-foreground active:scale-95 transition-transform">+</button>
                </div>
              </div>

              {/* Send to */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Send to</label>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setGroupRecipientType('group')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${groupRecipientType === 'group' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border/50'}`}>
                    <Users className="w-3.5 h-3.5" /> Group
                  </button>
                  <button onClick={() => setGroupRecipientType('individuals')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${groupRecipientType === 'individuals' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border/50'}`}>
                    <User className="w-3.5 h-3.5" /> People
                  </button>
                </div>
                {groupRecipientType === 'group' && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dbGroups.map(g => (
                      <button key={g.id} onClick={() => setGroupSelectedGroupId(g.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${groupSelectedGroupId === g.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                        <span>{g.emoji}</span>{g.name}
                      </button>
                    ))}
                    {dbGroups.length === 0 && <p className="text-xs text-muted-foreground py-2">Create a group first</p>}
                  </div>
                )}
                {groupRecipientType === 'individuals' && (
                  <div className="flex flex-wrap gap-2">
                    {connections.map(c => (
                      <button key={c.user_id} onClick={() => toggleGroupUser(c.user_id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${groupSelectedUserIds.includes(c.user_id) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'}`}>
                        <span>{c.avatar}</span>
                        <span>{c.name.split(' ')[0]}</span>
                        {groupSelectedUserIds.includes(c.user_id) && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      {tripType && (
        <div className="px-4 py-4 border-t border-border/50 bg-background" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            onClick={tripType === 'solo' ? handleSaveSolo : handleSaveGroup}
            disabled={saving}
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : tripType === 'solo' ? '✈️ Share Trip' : '🌍 Lob the Trip'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
