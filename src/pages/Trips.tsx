import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Plus, Globe, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { TripComposer } from '@/components/trips/TripComposer';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';
import { useSupabaseTrips, DbTrip } from '@/hooks/useSupabaseTrips';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const Trips = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allLobs = [] } = useSupabaseLobs();
  const { data: allTrips = [], isLoading } = useSupabaseTrips();
  const [showTripComposer, setShowTripComposer] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [isLoading]);

  const groupTripLobs = useMemo(() => allLobs.filter(l => l.category === 'group-trip'), [allLobs]);
  const myTrips = useMemo(() => allTrips.filter(t => t.user_id === user?.id), [allTrips, user]);
  const friendTrips = useMemo(() => allTrips.filter(t => t.user_id !== user?.id), [allTrips, user]);

  return (
    <AppLayout>
      <div ref={pageRef} className="w-full px-4">
        <div className="flex items-center justify-between pt-2 pb-2">
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Trips</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Travel plans & friend visits</p>
          </div>
          <button onClick={() => setShowTripComposer(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform">
            <Plus className="w-3.5 h-3.5" /> Add Trip
          </button>
        </div>

        <TripComposer open={showTripComposer} onClose={() => setShowTripComposer(false)} />

        {groupTripLobs.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-foreground mb-2">Group Trips</h2>
            <div className="space-y-2">{groupTripLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}</div>
          </section>
        )}

        <section className="mb-4">
          <h2 className="text-sm font-bold text-foreground mb-2">Your Trips</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : myTrips.length > 0 ? (
            <div className="space-y-2">
              {myTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="gradient-card rounded-2xl p-3 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{trip.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-foreground text-[15px]">{trip.city}{trip.country ? `, ${trip.country}` : ''}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trip.show_on_profile ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10"><Globe className="w-3 h-3" />Visible</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary"><Lock className="w-3 h-3" />Private</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
              <Plane className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming trips</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Share your travel plans with friends</p>
            </div>
          )}
        </section>

        {friendTrips.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-foreground mb-2">Friends Visiting</h2>
            <div className="space-y-2">
              {friendTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/trips/${trip.id}/friend`, { state: { trip } })}
                  className="gradient-card rounded-2xl p-3 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{trip.userAvatar || trip.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-foreground text-[15px]">{trip.userName || 'Friend'}</h3>
                        <span className="text-xs text-muted-foreground">→ {trip.city}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-lg">{trip.emoji}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Trips;
