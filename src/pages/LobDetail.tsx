import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Share2, MessageCircle, CheckCircle2, Check, Users,
  Bell, MoreVertical, XCircle, Repeat, Send, Plus, CalendarIcon, UserPlus, Minus,
  Megaphone, Crown, Sparkles,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { lobs, users, groups, currentUser } from '@/data/seed';
import { CATEGORY_CONFIG, ResponseType, LobComment, RECURRENCE_OPTIONS, TimeOption } from '@/data/types';
import { useCreatedLobs } from '@/hooks/useCreatedLobs';
import { lobStore } from '@/stores/lobStore';
import { ResponseButtons } from '@/components/lob/ResponseButtons';
import { QuorumRing } from '@/components/lob/QuorumRing';
import { StatusPill } from '@/components/lob/StatusPill';
import { LocationMap } from '@/components/lob/LocationMap';
import { DeadlineCountdown } from '@/components/lob/DeadlineCountdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Day/Time chip helpers ───
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

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

const LobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const createdLobs = useCreatedLobs();
  const lob = lobs.find(l => l.id === id) || createdLobs.find(l => l.id === id);
  const [myResponse, setMyResponse] = useState<ResponseType | undefined>(
    lob?.responses.find(r => r.userId === 'u1')?.response
  );
  const [votedTimeIds, setVotedTimeIds] = useState<string[]>(
    lob?.timeOptions.filter(t => t.votes.includes('u1')).map(t => t.id) || []
  );
  const [lastNudgeTime, setLastNudgeTime] = useState<number | null>(null);
  const [comments, setComments] = useState<LobComment[]>(lob?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelled, setIsCancelled] = useState(lob?.status === 'cancelled');

  // Time suggestion state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [suggestDay, setSuggestDay] = useState<Date | undefined>(undefined);
  const [suggestTime, setSuggestTime] = useState('');

  // Dynamic time options (can be added to by creator)
  const [extraTimeOptions, setExtraTimeOptions] = useState<TimeOption[]>([]);

  // Inline date edit for creator
  const [editingTime, setEditingTime] = useState(false);
  const [editDay, setEditDay] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState('');
  const [overriddenTime, setOverriddenTime] = useState<string | null>(null);

  // Open Invite state
  const [openInviteEnabled, setOpenInviteEnabled] = useState(lob?.openInviteEnabled || false);
  const [openInviteMaxGuests, setOpenInviteMaxGuests] = useState(lob?.openInviteMaxGuests || 3);
  const [openInviteUsedGuests, setOpenInviteUsedGuests] = useState(lob?.openInviteUsedGuests || 0);
  const [showInviteGuest, setShowInviteGuest] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');

  // Fill a Seat state
  const [fillASeatActive, setFillASeatActive] = useState(lob?.fillASeatActive || false);
  const [fillASeatSpots, setFillASeatSpots] = useState(lob?.fillASeatSpots || 1);
  const [showFillASeat, setShowFillASeat] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);

  if (!lob) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Lob not found</p>
        </div>
      </AppLayout>
    );
  }

  const allTimeOptions = [...lob.timeOptions, ...extraTimeOptions];

  const config = CATEGORY_CONFIG[lob.category];
  const group = groups.find(g => g.id === lob.groupId);
  const isCreator = lob.createdBy === 'u1';
  const inList = lob.responses.filter(r => r.response === 'in');
  const inCount = myResponse === 'in' ? inList.length + (inList.find(r => r.userId === 'u1') ? 0 : 1) : inList.length;
  const quorumReached = inCount >= lob.quorum;

  const respondedUserIds = lob.responses.map(r => r.userId);
  const groupMembers = group?.members || [];
  const unrespondedCount = groupMembers.filter(m => !respondedUserIds.includes(m.id)).length;

  const timeStr = overriddenTime || lob.selectedTime || lob.timeOptions[0]?.datetime;
  const parsedDate = timeStr ? new Date(timeStr) : null;
  const isInvalidDate = !parsedDate || isNaN(parsedDate.getTime());
  const formattedTime = isInvalidDate
    ? 'Invalid Date'
    : parsedDate.toLocaleString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });

  const handleSaveTime = () => {
    if (!editDay || !editTime) return;
    const parsed = parseTimeString(editTime);
    if (!parsed) return;
    const dt = new Date(editDay);
    dt.setHours(parsed.hours, parsed.minutes, 0, 0);
    const iso = dt.toISOString();
    setOverriddenTime(iso);
    lobStore.updateLobTime(lob.id, iso);
    setEditingTime(false);
    toast.success('Date updated!');
  };

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';
  const getUserAvatar = (userId: string) => users.find(u => u.id === userId)?.avatar || '👤';

  const canNudge = !lastNudgeTime || (Date.now() - lastNudgeTime > 2 * 60 * 60 * 1000);

  const handleNudge = () => {
    if (!canNudge) {
      toast.error('You can nudge again in 2 hours');
      return;
    }
    setLastNudgeTime(Date.now());
    toast.success(`Nudged ${unrespondedCount} people!`);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: LobComment = {
      id: `c-${Date.now()}`,
      userId: 'u1',
      message: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const handleSuggestTime = () => {
    if (!suggestDay || !suggestTime) return;
    const parsed = parseTimeString(suggestTime);
    if (!parsed) return;
    const dt = new Date(suggestDay);
    dt.setHours(parsed.hours, parsed.minutes, 0, 0);
    const comment: LobComment = {
      id: `c-${Date.now()}`,
      userId: 'u1',
      message: '',
      createdAt: new Date().toISOString(),
      suggestedTime: dt.toISOString(),
    };
    setComments(prev => [...prev, comment]);
    setShowTimePicker(false);
    setSuggestDay(undefined);
    setSuggestTime('');
    toast.success('Time suggestion posted!');
  };

  const handleAddToPoll = (suggestedTime: string) => {
    const alreadyExists = allTimeOptions.some(t => t.datetime === suggestedTime);
    if (alreadyExists) {
      toast.error('This time is already in the poll');
      return;
    }
    const newOption: TimeOption = {
      id: `to-${Date.now()}`,
      datetime: suggestedTime,
      votes: [],
    };
    setExtraTimeOptions(prev => [...prev, newOption]);
    toast.success('Time added to poll!');
  };

  const handleCancel = () => {
    setIsCancelled(true);
    setShowCancelDialog(false);
    setShowMenu(false);
    toast.success('Plan cancelled. Everyone has been notified.');
  };

  const recurrenceLabel = lob.recurrence
    ? RECURRENCE_OPTIONS.find(r => r.key === lob.recurrence)?.label
    : null;

  const effectiveStatus = isCancelled ? 'cancelled' : lob.status;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <StatusPill status={effectiveStatus} />
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          {isCreator && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              >
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-card border border-border shadow-card overflow-hidden"
                  >
                    <button
                      onClick={() => { setShowMenu(false); setShowCancelDialog(true); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-secondary/50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Plan
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Cancel confirmation dialog */}
        <AnimatePresence>
          {showCancelDialog && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelDialog(false)}
                className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto bg-card rounded-2xl border border-border shadow-card p-6"
              >
                <h3 className="font-bold text-foreground text-lg mb-2">Cancel this plan?</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Are you sure you want to cancel this plan? Everyone will be notified.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm"
                  >
                    Keep it
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                  >
                    Cancel Plan
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cancelled banner */}
        {isCancelled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 bg-destructive/10 border border-destructive/30 mb-4 flex items-center gap-3"
          >
            <XCircle className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-bold text-foreground text-sm">Plan cancelled</p>
              <p className="text-xs text-muted-foreground">This plan has been cancelled by the creator</p>
            </div>
          </motion.div>
        )}

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">{lob.title}</h1>
              <p className="text-sm text-muted-foreground">{lob.groupName}</p>
            </div>
          </div>
          {recurrenceLabel && (
            <div className="flex items-center gap-1.5 mt-2">
              <Repeat className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{recurrenceLabel}</span>
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4 space-y-3"
        >
          <div
            className={cn(
              'flex items-center gap-2 text-sm',
              isInvalidDate && isCreator ? 'text-destructive cursor-pointer' : 'text-foreground',
              isCreator && 'cursor-pointer'
            )}
            onClick={() => isCreator && setEditingTime(true)}
          >
            <Clock className={cn('w-4 h-4', isInvalidDate ? 'text-destructive' : 'text-primary')} />
            <span>{formattedTime}</span>
            {isCreator && (
              <span className="text-xs text-muted-foreground ml-1">tap to edit</span>
            )}
          </div>
          <AnimatePresence>
            {editingTime && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2"
              >
                <p className="text-xs font-medium text-muted-foreground">Pick a day</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {DAY_CHIPS.map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => setEditDay(chip.date)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all',
                        editDay && isSameDay(editDay, chip.date)
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Pick a time</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {TIME_CHIPS.filter((_, i) => i % 2 === 0).map(t => (
                    <button
                      key={t}
                      onClick={() => setEditTime(t)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all',
                        editTime === t
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTime(false)}
                    className="flex-1 py-2 rounded-xl bg-secondary text-muted-foreground text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTime}
                    disabled={!editDay || !editTime}
                    className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {lob.location && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{lob.location}</span>
            </div>
          )}
        </motion.div>

        {lob.location && <LocationMap location={lob.location} />}

        {/* Status Banner */}
        {effectiveStatus === 'voting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-4 mb-4 flex items-center gap-3 ${
              quorumReached
                ? 'bg-lob-confirmed/10 border border-lob-confirmed/30'
                : 'bg-secondary/50 border border-border/50'
            }`}
          >
            {quorumReached ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-lob-confirmed" />
                <div>
                  <p className="font-bold text-foreground text-sm">It's on! 🎉</p>
                  <p className="text-xs text-muted-foreground">Ready to confirm this plan</p>
                </div>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-bold text-foreground text-sm">Waiting on {lob.quorum - inCount} more</p>
                  <p className="text-xs text-muted-foreground">{inCount} of {lob.quorum} needed</p>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Response Buttons */}
        {effectiveStatus === 'voting' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4"
          >
            <ResponseButtons current={myResponse} onChange={setMyResponse} />
          </motion.div>
        )}

        {/* Nudge button (creator only) */}
        {isCreator && effectiveStatus === 'voting' && unrespondedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="mb-4"
          >
            <button
              onClick={handleNudge}
              disabled={!canNudge}
              className="w-full py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity hover:bg-primary/15"
            >
              <Bell className="w-4 h-4" />
              Nudge {unrespondedCount}
            </button>
          </motion.div>
        )}

        {/* Attendance Ring */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-5 border border-border/50 shadow-card mb-4"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-4">ATTENDANCE</p>
          <QuorumRing current={inCount} target={lob.quorum} responses={lob.responses} />
        </motion.div>

        {/* Deadline Countdown */}
        {lob.deadline && effectiveStatus === 'voting' && (
          <DeadlineCountdown
            deadline={lob.deadline}
            isCreator={isCreator}
            quorumReached={quorumReached}
          />
        )}

        {/* Open Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">OPEN INVITE</p>
            </div>
            {isCreator && (
              <button
                onClick={() => {
                  setOpenInviteEnabled(!openInviteEnabled);
                  toast.success(openInviteEnabled ? 'Open invite disabled' : 'Open invite enabled');
                }}
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-full transition-colors',
                  openInviteEnabled ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                )}
              >
                {openInviteEnabled ? 'On' : 'Off'}
              </button>
            )}
          </div>

          {openInviteEnabled ? (
            <div className="space-y-3">
              {isCreator && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Max guests:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOpenInviteMaxGuests(Math.max(1, openInviteMaxGuests - 1))}
                      className="w-7 h-7 rounded-full border border-border bg-card flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="text-sm font-bold text-primary tabular-nums">{openInviteMaxGuests}</span>
                    <button
                      onClick={() => setOpenInviteMaxGuests(Math.min(10, openInviteMaxGuests + 1))}
                      className="w-7 h-7 rounded-full border border-border bg-card flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/50">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-foreground font-medium">
                  {openInviteMaxGuests - openInviteUsedGuests} guest spot{openInviteMaxGuests - openInviteUsedGuests !== 1 ? 's' : ''} remaining
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {openInviteUsedGuests}/{openInviteMaxGuests} used
                </span>
              </div>

              {/* Invite a guest button — shown to confirmed attendees */}
              {myResponse === 'in' && openInviteUsedGuests < openInviteMaxGuests && (
                <>
                  <button
                    onClick={() => setShowInviteGuest(!showInviteGuest)}
                    className="w-full py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/15 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite a guest
                  </button>
                  <AnimatePresence>
                    {showInviteGuest && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
                          <input
                            type="text"
                            placeholder="Search people..."
                            value={guestSearch}
                            onChange={e => setGuestSearch(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {users
                              .filter(u => u.id !== 'u1' && !lob.responses.some(r => r.userId === u.id) && u.name.toLowerCase().includes(guestSearch.toLowerCase()))
                              .slice(0, 5)
                              .map(u => (
                                <button
                                  key={u.id}
                                  onClick={() => {
                                    setOpenInviteUsedGuests(prev => prev + 1);
                                    setShowInviteGuest(false);
                                    setGuestSearch('');
                                    toast.success(`Invited ${u.name}! They'll see the activity, time, and location.`);
                                  }}
                                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
                                >
                                  <span className="text-lg">{u.avatar}</span>
                                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                                  <span className="ml-auto text-[10px] text-muted-foreground">Invite</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isCreator ? 'Turn on to let confirmed attendees bring guests' : 'Guest invites are currently disabled'}
            </p>
          )}
        </motion.div>

        {/* Fill a Seat — Pro feature */}
        {isCreator && effectiveStatus === 'voting' && !quorumReached && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.23 }}
            className="mb-4"
          >
            {fillASeatActive ? (
              <div className="gradient-card rounded-2xl p-4 border border-primary/30 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-primary">FILL A SEAT — ACTIVE</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Broadcasting to nearby users with matching interests. {fillASeatSpots} spot{fillASeatSpots !== 1 ? 's' : ''} open.
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">Waiting for requests from nearby users...</span>
                </div>
                <button
                  onClick={() => {
                    setFillASeatActive(false);
                    toast.success('Fill a Seat broadcast stopped');
                  }}
                  className="w-full mt-3 py-2 rounded-xl bg-secondary text-muted-foreground text-sm font-medium"
                >
                  Stop broadcast
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (currentUser.isPro) {
                    setShowFillASeat(true);
                  } else {
                    setShowProUpgrade(true);
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:from-primary/25 hover:to-primary/15 transition-all"
              >
                <Megaphone className="w-4 h-4" />
                Fill a Seat
                {!currentUser.isPro && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">PRO</span>
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* Fill a Seat setup dialog */}
        <AnimatePresence>
          {showFillASeat && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFillASeat(false)}
                className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto bg-card rounded-2xl border border-border shadow-card p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-lg">Fill a Seat</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Broadcast to nearby users who are into {config.label.toLowerCase()}. They can request to join and you approve.
                </p>
                <div className="flex items-center justify-center gap-4 mb-5">
                  <button
                    onClick={() => setFillASeatSpots(Math.max(1, fillASeatSpots - 1))}
                    className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-primary tabular-nums">{fillASeatSpots}</span>
                    <p className="text-[11px] text-muted-foreground">spot{fillASeatSpots !== 1 ? 's' : ''} to fill</p>
                  </div>
                  <button
                    onClick={() => setFillASeatSpots(Math.min(lob.quorum - inCount, fillASeatSpots + 1))}
                    className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFillASeat(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setFillASeatActive(true);
                      setShowFillASeat(false);
                      toast.success(`Broadcasting ${fillASeatSpots} open spot${fillASeatSpots !== 1 ? 's' : ''} to nearby users!`);
                    }}
                    className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                  >
                    Broadcast
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Pro Upgrade Prompt */}
        <AnimatePresence>
          {showProUpgrade && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowProUpgrade(false)}
                className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto bg-card rounded-2xl border border-border shadow-card p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">Upgrade to Lob Pro</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Fill a Seat lets you broadcast open spots to nearby users who match your activity. Upgrade to Pro to unlock this and more.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowProUpgrade(false);
                      toast('Pro upgrade coming soon! 🚀');
                    }}
                    className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                  >
                    Upgrade to Pro
                  </button>
                  <button
                    onClick={() => setShowProUpgrade(false)}
                    className="w-full py-2 text-sm text-muted-foreground"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Time Poll */}
        {allTimeOptions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4"
          >
            <p className="text-xs font-semibold text-muted-foreground mb-3">⏱ TIME POLL — tap to vote</p>
            <div className="space-y-2">
              {allTimeOptions.map(opt => {
                const t = new Date(opt.datetime);
                const iVoted = votedTimeIds.includes(opt.id);
                const voteCount = opt.votes.length + (iVoted && !opt.votes.includes('u1') ? 1 : 0);
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setVotedTimeIds(prev =>
                        prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                      );
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      iVoted ? 'bg-primary/10 border-primary' : 'bg-secondary/50 border-border/50 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        iVoted ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                      }`}>
                        {iVoted && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {t.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {opt.votes.slice(0, 3).map(uid => (
                          <span key={uid} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card">
                            {getUserAvatar(uid)}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{voteCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
            COMMENTS {comments.length > 0 && `(${comments.length})`}
          </p>

          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground mb-3">No comments yet. Start the conversation!</p>
          )}

          <div className="space-y-3 mb-3">
            {comments.map(c => {
              const timeDiff = Date.now() - new Date(c.createdAt).getTime();
              const mins = Math.floor(timeDiff / 60000);
              const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;

              // Time suggestion card
              if (c.suggestedTime) {
                const suggestedDate = new Date(c.suggestedTime);
                const alreadyInPoll = allTimeOptions.some(t => t.datetime === c.suggestedTime);
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <button
                      onClick={() => navigate(c.userId === 'u1' ? '/profile' : `/user/${c.userId}`)}
                      className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0 mt-0.5 active:scale-90 transition-transform"
                    >
                      {getUserAvatar(c.userId)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-foreground">{getUserName(c.userId)}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                      </div>
                      <div className="mt-1.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">
                            {suggestedDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2">Suggested time</p>
                        {isCreator && !alreadyInPoll && (
                          <button
                            onClick={() => handleAddToPoll(c.suggestedTime!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add to poll
                          </button>
                        )}
                        {alreadyInPoll && (
                          <span className="flex items-center gap-1 text-[11px] text-primary/70">
                            <Check className="w-3 h-3" /> Added to poll
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular comment
              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  <button
                    onClick={() => navigate(c.userId === 'u1' ? '/profile' : `/user/${c.userId}`)}
                    className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0 mt-0.5 active:scale-90 transition-transform"
                  >
                    {getUserAvatar(c.userId)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-foreground">{getUserName(c.userId)}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                    </div>
                    <p className="text-sm text-foreground/90 mt-0.5">{c.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time picker inline */}
          <AnimatePresence>
            {showTimePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Suggest a time</p>
                    <button onClick={() => setShowTimePicker(false)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Day</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {DAY_CHIPS.map(c => (
                        <button
                          key={c.label}
                          onClick={() => setSuggestDay(c.date)}
                          className={cn(
                            'shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                            isSameDay(suggestDay, c.date)
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Time</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {TIME_CHIPS.map(t => (
                        <button
                          key={t}
                          onClick={() => setSuggestTime(t)}
                          className={cn(
                            'shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                            suggestTime === t
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {suggestDay && suggestTime && (
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Clock className="w-3 h-3" />
                      {format(suggestDay, 'EEE, MMM d')} at {suggestTime}
                    </div>
                  )}

                  <button
                    onClick={handleSuggestTime}
                    disabled={!suggestDay || !suggestTime}
                    className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs disabled:opacity-40 transition-opacity"
                  >
                    Post suggestion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add comment + suggest time */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors',
                showTimePicker
                  ? 'bg-primary/15 border-primary text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'
              )}
              title="Suggest a time"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="flex-1 p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </motion.div>

        <div className="h-6" />
      </div>
    </AppLayout>
  );
};

export default LobDetail;
