import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComposer } from '@/hooks/useComposer';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pencil, Sparkles, Globe, Lock, X, Trash2, CheckCircle2, Clock, MoreVertical, Link, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSupabaseTrips } from '@/hooks/useSupabaseTrips';
import { useTripMembers, useTripSuggestions, useTripComments } from '@/hooks/useTripDetail';
import { TripAttendees } from '@/components/trips/TripAttendees';
import { TripVoting } from '@/components/trips/TripVoting';
import { TripComments } from '@/components/trips/TripComments';
import { TripInvitePicker } from '@/components/trips/TripInvitePicker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openComposer } = useComposer();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allTrips = [], isLoading } = useSupabaseTrips();
  const { data: members = [] } = useTripMembers(id);
  const { data: suggestions = [] } = useTripSuggestions(id);
  const { data: comments = [] } = useTripComments(id);

  const trip = useMemo(() => allTrips.find(t => t.id === id), [allTrips, id]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editData, setEditData] = useState({
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    showOnProfile: true,
  });

  const isOwner = trip?.user_id === user?.id;
  const hasDestination = !!(trip?.city && trip.city.trim() && trip.city.trim().toLowerCase() !== 'tbd');
  const hasDates = !!(trip?.start_date && trip?.end_date);
  const tripStatus = (hasDestination && hasDates) ? 'confirmed' : ((trip as any)?.status || 'planning');

  const openEditSheet = () => {
    if (!trip) return;
    setEditData({
      city: trip.city,
      country: trip.country,
      startDate: trip.start_date,
      endDate: trip.end_date,
      showOnProfile: trip.show_on_profile,
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!trip || !user || saving) return;
    if (!editData.city.trim() || !editData.startDate || !editData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('trips').update({
        city: editData.city,
        country: editData.country,
        start_date: editData.startDate,
        end_date: editData.endDate,
        show_on_profile: editData.showOnProfile,
      }).eq('id', trip.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      toast.success('Trip updated!');
      setEditing(false);
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!trip || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('trips').delete().eq('id', trip.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      toast.success('Trip deleted');
      navigate('/trips');
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!trip || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('trips').update({ status: 'cancelled' }).eq('id', trip.id);
      if (error) throw error;
      // Notify all members
      const memberNotifs = members
        .filter(m => m.user_id !== user.id)
        .map(m => ({
          user_id: m.user_id,
          trip_id: trip.id,
          type: 'cancelled',
          title: 'Trip cancelled',
          body: `"${trip.city}" trip has been cancelled`,
          emoji: '❌',
        }));
      if (memberNotifs.length > 0) {
        await supabase.from('notifications').insert(memberNotifs);
      }
      queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      toast.success('Trip cancelled');
      navigate('/trips');
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://lob-app.lovable.app/trips/${trip?.id}`);
    toast.success('Link copied!');
    setShowMenu(false);
  };

  const handleConfirmTrip = async () => {
    if (!trip || !isOwner) return;
    try {
      const { error } = await supabase.from('trips').update({ status: 'confirmed' }).eq('id', trip.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      toast.success('Trip confirmed! 🎉');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground text-sm">Loading trip...</p>
        </div>
      </AppLayout>
    );
  }

  if (!trip) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4">
          <div className="pt-12 pb-6">
            <button onClick={() => navigate('/trips')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-muted-foreground">Trip not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const dateStr = `${new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  const daysAway = differenceInDays(new Date(trip.start_date), new Date());

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <button
            onClick={() => navigate('/trips')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          {isOwner && (
            <button
              onClick={openEditSheet}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <Pencil className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>

        {/* Trip info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
          <span className="text-5xl mb-3 block">{trip.emoji}</span>
          <h1 className="text-2xl font-extrabold text-foreground">{trip.city}{trip.country ? `, ${trip.country}` : ''}</h1>
          <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>

          {/* Status & Countdown */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {trip.show_on_profile ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent px-2.5 py-1 rounded-full bg-accent/10">
                <Globe className="w-3 h-3" /> Visible on Profile
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground px-2.5 py-1 rounded-full bg-secondary">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
            {tripStatus === 'confirmed' ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent px-2.5 py-1 rounded-full bg-accent/10">
                <CheckCircle2 className="w-3 h-3" /> Confirmed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary px-2.5 py-1 rounded-full bg-primary/10">
                <Clock className="w-3 h-3" /> Planning
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {tripStatus === 'confirmed'
              ? daysAway > 0 ? `${daysAway} day${daysAway !== 1 ? 's' : ''} away` : daysAway === 0 ? "Today! 🎉" : "Already happened"
              : "Planning in progress"
            }
          </p>

          {isOwner && tripStatus === 'planning' && (
            <button
              onClick={handleConfirmTrip}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Trip
            </button>
          )}
        </motion.div>

        {/* Attendees */}
        <TripAttendees
          members={members}
          isOwner={isOwner}
          onInvite={() => setShowInvite(true)}
        />

        {/* Voting */}
        {user && (
          <TripVoting
            tripId={trip.id}
            userId={user.id}
            isOwner={isOwner}
            status={tripStatus}
            suggestions={suggestions}
            hasDestination={hasDestination}
            hasDates={hasDates}
          />
        )}

        {/* Comments */}
        {user && (
          <TripComments
            tripId={trip.id}
            userId={user.id}
            comments={comments}
          />
        )}

        {/* Lob the Group */}
        {members.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => openComposer({ prefillUserIds: members.map(m => m.user_id) })}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow mb-8 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            Lob the Group
          </motion.button>
        )}

        {/* Edit Sheet */}
        <AnimatePresence>
          {editing && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, pointerEvents: 'none' as any }}
                onClick={() => { setEditing(false); setShowDeleteConfirm(false); }}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
              >
                <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-foreground">✏️ Edit Trip</h2>
                    <button onClick={() => { setEditing(false); setShowDeleteConfirm(false); }} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input type="text" placeholder="City" value={editData.city} onChange={e => setEditData(p => ({ ...p, city: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Country" value={editData.country} onChange={e => setEditData(p => ({ ...p, country: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Start</label>
                        <input type="date" value={editData.startDate} onChange={e => setEditData(p => ({ ...p, startDate: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">End</label>
                        <input type="date" value={editData.endDate} onChange={e => setEditData(p => ({ ...p, endDate: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                      </div>
                    </div>
                    <button onClick={() => setEditData(p => ({ ...p, showOnProfile: !p.showOnProfile }))} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer">
                      {editData.showOnProfile ? <Globe className="w-4 h-4 text-accent" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm font-medium text-foreground flex-1 text-left">{editData.showOnProfile ? 'Visible on profile' : 'Private trip'}</span>
                    </button>
                    <button onClick={handleSaveEdit} disabled={saving} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm cursor-pointer disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                    {/* Delete */}
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-destructive text-sm font-medium cursor-pointer hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Trip
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={saving}
                          className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold cursor-pointer disabled:opacity-50"
                        >
                          {saving ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Invite Picker */}
        <TripInvitePicker
          open={showInvite}
          onClose={() => setShowInvite(false)}
          tripId={trip.id}
          existingMemberIds={members.map(m => m.user_id)}
        />
      </div>
    </AppLayout>
  );
};

export default TripDetail;
