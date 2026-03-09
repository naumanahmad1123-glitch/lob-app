import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Share2, MessageCircle, CheckCircle2, Check, Users,
  Bell, MoreVertical, XCircle, Repeat, Send, Plus, CalendarIcon, UserPlus, Minus,
  DoorOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CATEGORY_CONFIG, ResponseType, LobComment, RECURRENCE_OPTIONS, TimeOption } from '@/data/types';
import { TripPlanningSection } from '@/components/trips/TripPlanningSection';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseLob } from '@/hooks/useSupabaseLobs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ResponseButtons } from '@/components/lob/ResponseButtons';
import { QuorumRing } from '@/components/lob/QuorumRing';
import { StatusPill } from '@/components/lob/StatusPill';
import { LocationMap } from '@/components/lob/LocationMap';
import { DeadlineCountdown } from '@/components/lob/DeadlineCountdown';
import { BailSheet } from '@/components/lob/BailSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateDayChips, generateTimeChips, isSameDay, parseTimeString } from '@/lib/lob-utils';

const DAY_CHIPS = generateDayChips();
const TIME_CHIPS = generateTimeChips();

const LobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: lob, isLoading } = useSupabaseLob(id);
  
  const myResponse = lob?.responses.find(r => r.userId === user?.id)?.response as ResponseType | undefined;
  const [lastNudgeTime, setLastNudgeTime] = useState<number | null>(null);
  const [localComments, setLocalComments] = useState<LobComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showBailSheet, setShowBailSheet] = useState(false);

  // Sync comments from DB
  useEffect(() => {
    if (lob?.comments) setLocalComments(lob.comments);
  }, [lob?.comments]);

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div></AppLayout>;
  }

  if (!lob) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Lob not found</p></div></AppLayout>;
  }

  const config = CATEGORY_CONFIG[lob.category];
  const isCreator = lob.createdBy === user?.id;
  const inList = lob.responses.filter(r => r.response === 'in');
  const maybeList = lob.responses.filter(r => r.response === 'maybe');
  const inCount = inList.length;
  const maybeCount = maybeList.length;
  const quorumReached = inCount >= lob.quorum;

  const timeStr = lob.selectedTime || lob.timeOptions[0]?.datetime;
  const parsedDate = timeStr ? new Date(timeStr) : null;
  const isInvalidDate = !parsedDate || isNaN(parsedDate.getTime());
  const formattedTime = isInvalidDate
    ? 'Time TBD'
    : parsedDate.toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const canNudge = !lastNudgeTime || (Date.now() - lastNudgeTime > 2 * 60 * 60 * 1000);

  const handleResponse = async (response: ResponseType) => {
    if (!user) return;
    // Upsert response
    const existing = lob.responses.find(r => r.userId === user.id);
    if (existing) {
      await supabase.from('lob_responses').update({ response }).eq('lob_id', lob.id).eq('user_id', user.id);
    } else {
      await supabase.from('lob_responses').insert({ lob_id: lob.id, user_id: user.id, response });
    }
    queryClient.invalidateQueries({ queryKey: ['supabase-lob', id] });
    queryClient.invalidateQueries({ queryKey: ['supabase-lobs'] });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from('lob_comments').insert({
      lob_id: lob.id,
      user_id: user.id,
      message: newComment.trim(),
    });
    setNewComment('');
    queryClient.invalidateQueries({ queryKey: ['supabase-lob', id] });
  };

  const handleCancel = async () => {
    await supabase.from('lobs').update({ status: 'cancelled' }).eq('id', lob.id);
    setShowCancelDialog(false);
    setShowMenu(false);
    queryClient.invalidateQueries({ queryKey: ['supabase-lob', id] });
    queryClient.invalidateQueries({ queryKey: ['supabase-lobs'] });
    toast.success('Plan cancelled.');
  };

  const handleBail = async () => {
    await handleResponse('out');
    setShowBailSheet(false);
    toast.success('You bailed.');
  };

  const recurrenceLabel = lob.recurrence ? RECURRENCE_OPTIONS.find(r => r.key === lob.recurrence)?.label : null;
  const effectiveStatus = lob.status;
  const deadlinePassed = lob.deadline ? new Date(lob.deadline).getTime() < Date.now() : false;

  const handleLockIn = (destination: string, startDate: string, endDate: string) => {
    toast.success(`Trip locked in: ${destination} 🎉`);
  };

  const isGroupTrip = lob.category === 'group-trip';
  const showTripPlanning = isGroupTrip && lob.tripPlanningPhase && lob.tripPlanningPhase !== 'confirmed';

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <StatusPill status={effectiveStatus} />
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ title: lob.title, url: window.location.href });
              else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }
            }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          {isCreator && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -5 }} className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-card border border-border shadow-card overflow-hidden">
                    <button onClick={() => { setShowMenu(false); setShowCancelDialog(true); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-secondary/50 transition-colors cursor-pointer">
                      <XCircle className="w-4 h-4" /> Cancel Plan
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Cancel confirmation */}
        <AnimatePresence>
          {showCancelDialog && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' as any }} onClick={() => setShowCancelDialog(false)} className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto bg-card rounded-2xl border border-border shadow-card p-6">
                <h3 className="font-bold text-foreground text-lg mb-2">Cancel this plan?</h3>
                <p className="text-sm text-muted-foreground mb-5">Everyone will be notified.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowCancelDialog(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm cursor-pointer">Keep it</button>
                  <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm cursor-pointer">Cancel Plan</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cancelled banner */}
        {effectiveStatus === 'cancelled' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-4 bg-destructive/10 border border-destructive/30 mb-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-bold text-foreground text-sm">Plan cancelled</p>
              <p className="text-xs text-muted-foreground">This plan has been cancelled</p>
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

        {/* Trip Planning Section */}
        {showTripPlanning && (
          <div className="mb-4">
            <TripPlanningSection lob={lob} isCreator={isCreator} onLockIn={handleLockIn} />
          </div>
        )}

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{formattedTime}</span>
          </div>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-2xl p-4 mb-4 flex items-center gap-3 ${quorumReached ? 'bg-lob-confirmed/10 border border-lob-confirmed/30' : 'bg-secondary/50 border border-border/50'}`}>
            {quorumReached ? (
              <><CheckCircle2 className="w-6 h-6 text-lob-confirmed" /><div><p className="font-bold text-foreground text-sm">It's on! 🎉</p><p className="text-xs text-muted-foreground">Ready to confirm</p></div></>
            ) : (
              <><Users className="w-6 h-6 text-primary" /><div><p className="font-bold text-foreground text-sm">Waiting on {lob.quorum - inCount} more</p><p className="text-xs text-muted-foreground">{inCount} in · {maybeCount} maybe</p></div></>
            )}
          </motion.div>
        )}

        {/* Response Buttons */}
        {effectiveStatus === 'voting' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4">
            <ResponseButtons current={myResponse} onChange={handleResponse} />
          </motion.div>
        )}

        {/* Bail button */}
        {!isCreator && myResponse === 'in' && effectiveStatus !== 'cancelled' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-4">
            <button onClick={() => setShowBailSheet(true)} className="w-full py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <DoorOpen className="w-4 h-4" /> Can't make it
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {showBailSheet && (
            <BailSheet open={showBailSheet} onClose={() => setShowBailSheet(false)} onConfirm={handleBail} pastDeadline={deadlinePassed} userName="You" />
          )}
        </AnimatePresence>

        {/* Attendance Ring */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="gradient-card rounded-2xl p-5 border border-border/50 shadow-card mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-4">ATTENDANCE</p>
          <QuorumRing current={inCount} target={lob.quorum} responses={lob.responses} groupMembers={[]} />
        </motion.div>

        {/* Deadline */}
        {lob.deadline && effectiveStatus === 'voting' && (
          <div className="mb-4">
            <DeadlineCountdown deadline={lob.deadline} isCreator={isCreator} quorumReached={quorumReached} isMaybe={myResponse === 'maybe'} />
          </div>
        )}

        {/* Comments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">COMMENTS</p>
          </div>

          {localComments.length > 0 ? (
            <div className="space-y-3 mb-3">
              {localComments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">💬</div>
                  <div>
                    <p className="text-sm text-foreground">{c.message}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-3">No comments yet</p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="flex-1 p-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={handleAddComment} disabled={!newComment.trim()} className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-40">
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </motion.div>

        <div className="h-8" />
      </div>
    </AppLayout>
  );
};

export default LobDetail;
