import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, Sparkles, Globe, Lock, Plane } from 'lucide-react';
import { trips, users } from '@/data/seed';
import { TappableAvatar } from '@/components/TappableAvatar';

const TripDetail = () => {
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

  const sharedUsers = users.filter(u => trip.notifyUserIds.includes(u.id));
  const dateStr = `${new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Pencil className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Trip info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-5xl mb-3 block">{trip.emoji}</span>
          <h1 className="text-2xl font-extrabold text-foreground">{trip.city}, {trip.country}</h1>
          <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {trip.showOnProfile ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent px-2.5 py-1 rounded-full bg-accent/10">
                <Globe className="w-3 h-3" />
                Visible on Profile
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground px-2.5 py-1 rounded-full bg-secondary">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
        </motion.div>

        {/* Shared with */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-bold text-foreground mb-3">Shared With</h2>
          <div className="space-y-2">
            {sharedUsers.map(u => (
              <TappableAvatar key={u.id} userId={u.id} emoji={u.avatar}>
                <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card active:bg-secondary transition-colors">
                  <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {u.avatar}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    {u.city && <p className="text-xs text-muted-foreground">{u.city}</p>}
                  </div>
                </div>
              </TappableAvatar>
            ))}
          </div>
        </motion.section>

        {/* Lob the group */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/create')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Lob the Group
        </motion.button>
      </div>
    </div>
  );
};

export default TripDetail;
