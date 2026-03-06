import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, MessageCircle, Send, ThumbsUp, CalendarRange, Lock,
  Plus, Check, Globe, DollarSign, Compass,
} from 'lucide-react';
import { Lob, TripVibe } from '@/data/types';
import { users, currentUser } from '@/data/seed';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TripPlanningSectionProps {
  lob: Lob;
  isCreator: boolean;
  onLockIn: (destination: string, startDate: string, endDate: string) => void;
}

interface TripComment {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

const VIBE_EMOJIS: Record<string, string> = {
  beach: '🏖️', city: '🏙️', adventure: '🧗', ski: '⛷️', cultural: '🏛️', roadtrip: '🚗',
};

export function TripPlanningSection({ lob, isCreator, onLockIn }: TripPlanningSectionProps) {
  const navigate = useNavigate();
  const isFullyOpen = lob.tripPlanningMode === 'fully-open';
  const isDatesOpen = lob.tripPlanningMode === 'dates-open';
  const isVotingDestination = lob.tripPlanningPhase === 'voting-destination';
  const isVotingDates = lob.tripPlanningPhase === 'voting-dates';

  // Destination suggestions state
  const [destinations, setDestinations] = useState(lob.destinationOptions || []);
  const [newDestName, setNewDestName] = useState('');
  const [newDestNote, setNewDestNote] = useState('');
  const [showAddDest, setShowAddDest] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);

  // Date range voting state
  const [dateRanges, setDateRanges] = useState(lob.dateRangeOptions || []);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [showAddDates, setShowAddDates] = useState(false);
  const [selectedDateRangeId, setSelectedDateRangeId] = useState<string | null>(null);

  // Trip discussion state
  const [tripComments, setTripComments] = useState<TripComment[]>([
    ...(isFullyOpen ? [
      { id: 'tc1', userId: 'u2', message: 'I was thinking somewhere warm — beach vibes for sure 🌴', createdAt: '2026-03-04T15:00' },
      { id: 'tc2', userId: 'u4', message: 'Bali has been on my list forever. Also super affordable once you're there', createdAt: '2026-03-04T16:30' },
      { id: 'tc3', userId: 'u1', message: 'Down for Bali or Costa Rica. Both hit the adventure + beach vibe', createdAt: '2026-03-04T17:00' },
    ] : []),
    ...(isDatesOpen ? [
      { id: 'tc4', userId: 'u3', message: 'Early August works best for me — before things get crazy at work', createdAt: '2026-03-04T11:00' },
      { id: 'tc5', userId: 'u1', message: 'I can do either window honestly. Slight preference for the first one', createdAt: '2026-03-04T12:00' },
    ] : []),
  ]);
  const [newTripComment, setNewTripComment] = useState('');

  // Lock-in state
  const [showLockIn, setShowLockIn] = useState(false);
  const [lockDestination, setLockDestination] = useState('');
  const [lockStartDate, setLockStartDate] = useState('');
  const [lockEndDate, setLockEndDate] = useState('');

  const getUserName = (uid: string) => users.find(u => u.id === uid)?.name || 'Unknown';
  const getUserAvatar = (uid: string) => users.find(u => u.id === uid)?.avatar || '👤';

  const handleAddDestination = () => {
    if (!newDestName.trim()) return;
    const newDest = {
      id: `dest-${Date.now()}`,
      name: newDestName.trim(),
      note: newDestNote.trim() || undefined,
      votes: [currentUser.id],
    };
    setDestinations(prev => [...prev, newDest]);
    setNewDestName('');
    setNewDestNote('');
    setShowAddDest(false);
    toast.success(`${newDest.name} added!`);
  };

  const handleVoteDestination = (destId: string) => {
    setDestinations(prev => prev.map(d => {
      if (d.id !== destId) return d;
      const hasVoted = d.votes.includes(currentUser.id);
      return {
        ...d,
        votes: hasVoted
          ? d.votes.filter(v => v !== currentUser.id)
          : [...d.votes, currentUser.id],
      };
    }));
  };

  const handleSelectDestination = (destId: string) => {
    setSelectedDestId(destId);
    const dest = destinations.find(d => d.id === destId);
    if (dest) {
      setLockDestination(dest.name);
      toast.success(`${dest.name} selected as destination`);
    }
  };

  const handleAddDateRange = () => {
    if (!newStartDate || !newEndDate) return;
    const newRange = {
      id: `dr-${Date.now()}`,
      startDate: newStartDate,
      endDate: newEndDate,
      votes: [currentUser.id],
    };
    setDateRanges(prev => [...prev, newRange]);
    setNewStartDate('');
    setNewEndDate('');
    setShowAddDates(false);
    toast.success('Date option added!');
  };

  const handleVoteDateRange = (drId: string) => {
    setDateRanges(prev => prev.map(dr => {
      if (dr.id !== drId) return dr;
      const hasVoted = dr.votes.includes(currentUser.id);
      return {
        ...dr,
        votes: hasVoted
          ? dr.votes.filter(v => v !== currentUser.id)
          : [...dr.votes, currentUser.id],
      };
    }));
  };

  const handleAddTripComment = () => {
    if (!newTripComment.trim()) return;
    setTripComments(prev => [...prev, {
      id: `tc-${Date.now()}`,
      userId: currentUser.id,
      message: newTripComment.trim(),
      createdAt: new Date().toISOString(),
    }]);
    setNewTripComment('');
  };

  const handleLockIn = () => {
    if (!lockDestination.trim() || !lockStartDate || !lockEndDate) {
      toast.error('Fill in destination and dates to lock it in');
      return;
    }
    onLockIn(lockDestination.trim(), lockStartDate, lockEndDate);
    setShowLockIn(false);
    toast.success('Trip locked in! 🎉 RSVP flow activated.');
  };

  const sortedDestinations = [...destinations].sort((a, b) => b.votes.length - a.votes.length);
  const sortedDateRanges = [...dateRanges].sort((a, b) => b.votes.length - a.votes.length);

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${s} – ${e}`;
  };

  return (
    <div className="space-y-4">
      {/* Trip info banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 border border-primary/20 shadow-card"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03), hsl(var(--background)))',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wide">
            {isVotingDestination ? 'Voting on Destination' : 'Voting on Dates'}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {lob.tripTimeframe && (
            <span className="flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5" /> {lob.tripTimeframe}
            </span>
          )}
          {lob.tripBudget && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> {lob.tripBudget}
            </span>
          )}
          {lob.tripVibes && lob.tripVibes.length > 0 && (
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              {lob.tripVibes.map(v => `${VIBE_EMOJIS[v] || ''} ${v}`).join(', ')}
            </span>
          )}
          {lob.destination && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {lob.destination}
            </span>
          )}
        </div>
      </motion.div>

      {/* ─── DESTINATION SUGGESTIONS (fully-open only) ─── */}
      {isFullyOpen && isVotingDestination && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              DESTINATION SUGGESTIONS
            </p>
            <button
              onClick={() => setShowAddDest(!showAddDest)}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Suggest
            </button>
          </div>

          {/* Add destination form */}
          <AnimatePresence>
            {showAddDest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
                  <input
                    type="text"
                    placeholder="Destination name (e.g. Bali, Lisbon)"
                    value={newDestName}
                    onChange={e => setNewDestName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Why here? (optional)"
                    value={newDestNote}
                    onChange={e => setNewDestNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddDestination}
                    disabled={!newDestName.trim()}
                    className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
                  >
                    Add suggestion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Destination list */}
          <div className="space-y-2">
            {sortedDestinations.map((dest, i) => {
              const iVoted = dest.votes.includes(currentUser.id);
              const isSelected = selectedDestId === dest.id;
              return (
                <div
                  key={dest.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all',
                    isSelected
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-secondary/30 border-border/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {i === 0 && sortedDestinations.length > 1 && (
                        <span className="text-xs">🏆</span>
                      )}
                      <span className="text-sm font-bold text-foreground truncate">{dest.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Vote avatars */}
                      <div className="flex -space-x-1">
                        {dest.votes.slice(0, 4).map(uid => (
                          <span key={uid} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] border border-card">
                            {getUserAvatar(uid)}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleVoteDestination(dest.id)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95',
                          iVoted
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-secondary text-muted-foreground border border-border hover:border-primary/30'
                        )}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {dest.votes.length}
                      </button>
                    </div>
                  </div>
                  {(dest as any).note && (
                    <p className="text-[11px] text-muted-foreground mt-1">{(dest as any).note}</p>
                  )}
                  {/* Creator select button */}
                  {isCreator && !isSelected && (
                    <button
                      onClick={() => handleSelectDestination(dest.id)}
                      className="mt-2 text-[11px] font-semibold text-primary flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Select this destination
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {sortedDestinations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No suggestions yet — be the first to suggest a destination!
            </p>
          )}
        </motion.div>
      )}

      {/* ─── AVAILABILITY POLLING ─── */}
      {(isVotingDates || (isFullyOpen && selectedDestId)) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" />
              AVAILABILITY — when works?
            </p>
            <button
              onClick={() => setShowAddDates(!showAddDates)}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Propose dates
            </button>
          </div>

          {/* Add date range form */}
          <AnimatePresence>
            {showAddDates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">From</label>
                      <input
                        type="date"
                        value={newStartDate}
                        onChange={e => setNewStartDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">To</label>
                      <input
                        type="date"
                        value={newEndDate}
                        onChange={e => setNewEndDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddDateRange}
                    disabled={!newStartDate || !newEndDate}
                    className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
                  >
                    Propose this window
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date range options */}
          <div className="space-y-2">
            {sortedDateRanges.map((dr, i) => {
              const iVoted = dr.votes.includes(currentUser.id);
              const isSelectedDR = selectedDateRangeId === dr.id;
              return (
                <div
                  key={dr.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all',
                    isSelectedDR
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-secondary/30 border-border/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {i === 0 && sortedDateRanges.length > 1 && <span className="text-xs">🏆</span>}
                      <span className="text-sm font-bold text-foreground">
                        {formatDateRange(dr.startDate, dr.endDate)}
                      </span>
                      {isSelectedDR && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {dr.votes.slice(0, 4).map(uid => (
                          <span key={uid} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] border border-card">
                            {getUserAvatar(uid)}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleVoteDateRange(dr.id)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95',
                          iVoted
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-secondary text-muted-foreground border border-border hover:border-primary/30'
                        )}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {dr.votes.length}
                      </button>
                    </div>
                  </div>
                  {/* Availability grid: who voted */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dr.votes.map(uid => (
                      <span key={uid} className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {getUserName(uid)} ✓
                      </span>
                    ))}
                  </div>
                  {isCreator && !isSelectedDR && (
                    <button
                      onClick={() => {
                        setSelectedDateRangeId(dr.id);
                        setLockStartDate(dr.startDate);
                        setLockEndDate(dr.endDate);
                        toast.success('Dates selected');
                      }}
                      className="mt-2 text-[11px] font-semibold text-primary flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Select these dates
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {sortedDateRanges.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No date proposals yet — propose a window that works for you!
            </p>
          )}
        </motion.div>
      )}

      {/* ─── DISCUSSION ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card"
      >
        <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          TRIP DISCUSSION {tripComments.length > 0 && `(${tripComments.length})`}
        </p>

        {tripComments.length === 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            Start planning — where should we go? When works?
          </p>
        )}

        <div className="space-y-3 mb-3">
          {tripComments.map(c => {
            const timeDiff = Date.now() - new Date(c.createdAt).getTime();
            const mins = Math.floor(timeDiff / 60000);
            const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <button
                  onClick={() => navigate(c.userId === currentUser.id ? '/profile' : `/user/${c.userId}`)}
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

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add to the discussion..."
            value={newTripComment}
            onChange={e => setNewTripComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTripComment()}
            className="flex-1 p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddTripComment}
            disabled={!newTripComment.trim()}
            className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </motion.div>

      {/* ─── LOCK IT IN (creator only) ─── */}
      {isCreator && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {!showLockIn ? (
            <button
              onClick={() => setShowLockIn(true)}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Lock className="w-4 h-4" />
              Lock it in — convert to Defined Trip
            </button>
          ) : (
            <div className="gradient-card rounded-2xl p-4 border border-primary/30 shadow-card space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Lock in the details</span>
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Bali, Indonesia"
                  value={lockDestination}
                  onChange={e => setLockDestination(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">From</label>
                  <input
                    type="date"
                    value={lockStartDate}
                    onChange={e => setLockStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">To</label>
                  <input
                    type="date"
                    value={lockEndDate}
                    onChange={e => setLockEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLockIn(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockIn}
                  disabled={!lockDestination.trim() || !lockStartDate || !lockEndDate}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-40"
                >
                  🔒 Lock it in
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
