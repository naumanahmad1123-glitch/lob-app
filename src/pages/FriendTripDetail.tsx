import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, MapPin } from 'lucide-react';
import { trips, users, currentUser } from '@/data/seed';
import { TappableAvatar } from '@/components/TappableAvatar';

const FriendTripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = trips.find(t => t.id === id);

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const traveler = users.find(u => u.id === trip.userId);
  const dateStr = `${new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  // Check if current user overlaps in same city
  const myTrips = trips.filter(t => t.userId === currentUser.id && t.showOnProfile);
  const hasOverlap = myTrips.some(mt => {
    const sameCity = mt.city.toLowerCase() === trip.city.toLowerCase();
    const overlap = new Date(mt.startDate) <= new Date(trip.endDate) && new Date(mt.endDate) >= new Date(trip.startDate);
    return sameCity && overlap;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Lob CTA — prominent at top */}
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/create')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Make a Plan with {traveler?.name}
        </motion.button>

        {/* Trip card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="gradient-card rounded-2xl p-6 border border-border/50 shadow-card mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            {traveler && (
              <TappableAvatar userId={traveler.id} emoji={traveler.avatar}>
                <span className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
                  {traveler.avatar}
                </span>
              </TappableAvatar>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">{traveler?.name}'s Trip</h2>
              <p className="text-xs text-muted-foreground">to {trip.city}, {trip.country}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{trip.emoji}</span>
              <div>
                <p className="text-[15px] font-semibold text-foreground">{trip.city}, {trip.country}</p>
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
    </div>
  );
};

export default FriendTripDetail;
