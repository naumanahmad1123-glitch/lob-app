import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useComposer } from '@/hooks/useComposer';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSupabaseTrips, DbTrip } from '@/hooks/useSupabaseTrips';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const FriendTripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { openComposer } = useComposer();
  const { user } = useAuth();
  const { data: allTrips = [], isLoading } = useSupabaseTrips();

  // Use router state as immediate fallback while Supabase loads
  const statTrip = (location.state as any)?.trip as DbTrip | undefined;
  const dbTrip = useMemo(() => allTrips.find(t => t.id === id), [allTrips, id]);
  const trip = dbTrip || statTrip;

  // Check city overlap with my trips
  const hasOverlap = useMemo(() => {
    if (!trip || !user) return false;
    return allTrips.some(mt => {
      if (mt.user_id !== user.id || !mt.show_on_profile) return false;
      const sameCity = mt.city.toLowerCase() === trip.city.toLowerCase();
      const overlap = new Date(mt.start_date) <= new Date(trip.end_date) && new Date(mt.end_date) >= new Date(trip.start_date);
      return sameCity && overlap;
    });
  }, [allTrips, trip, user]);

  const dateStr = trip
    ? `${new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : '';

  const travelerName = trip?.userName || 'Friend';
  const travelerAvatar = trip?.userAvatar || trip?.emoji || '✈️';

  // Loading skeleton
  if (isLoading && !trip) {
    return (
      <AppLayout>
        <div className="w-full px-4">
          <div className="flex items-center pt-3 pb-4">
            <button onClick={() => navigate('/trips')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <Skeleton className="h-12 w-full rounded-2xl mb-6" />
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
        </div>
      </AppLayout>
    );
  }

  if (!trip) {
    return (
      <AppLayout>
        <div className="w-full px-4">
          <div className="pt-3 pb-4">
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

  return (
    <AppLayout>
      <div className="w-full px-4">
        {/* Header */}
        <div className="flex items-center pt-3 pb-4">
          <button onClick={() => navigate('/trips')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Lob CTA */}
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => openComposer({ prefillUserIds: trip.user_id ? [trip.user_id] : [] })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow mb-6 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          Make a Plan with {travelerName}
        </motion.button>

        {/* Trip card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="gradient-card rounded-2xl p-6 border border-border/50 shadow-card mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(`/user/${trip.user_id}`)}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl cursor-pointer active:scale-90 transition-transform"
            >
              {travelerAvatar}
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">{travelerName}'s Trip</h2>
              <p className="text-xs text-muted-foreground">to {trip.city}{trip.country ? `, ${trip.country}` : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{trip.emoji}</span>
              <div>
                <p className="text-[15px] font-semibold text-foreground">{trip.city}{trip.country ? `, ${trip.country}` : ''}</p>
                <p className="text-xs text-muted-foreground">{dateStr}</p>
              </div>
            </div>

            {hasOverlap && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">You'll both be in {trip.city} at the same time!</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default FriendTripDetail;
