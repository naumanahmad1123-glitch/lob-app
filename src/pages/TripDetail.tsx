import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComposer } from '@/hooks/useComposer';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pencil, Sparkles, Globe, Lock, X } from 'lucide-react';
import { trips, users } from '@/data/seed';
import { TappableAvatar } from '@/components/TappableAvatar';
import { toast } from 'sonner';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openComposer } = useComposer();
  const trip = trips.find(t => t.id === id);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    city: trip?.city || '',
    country: trip?.country || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    showOnProfile: trip?.showOnProfile ?? true,
  });

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const sharedUsers = users.filter(u => trip.notifyUserIds.includes(u.id));
  const dateStr = `${new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const handleSaveEdit = () => {
    if (!editData.city.trim() || !editData.startDate || !editData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Trip updated!');
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Pencil className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Edit Sheet */}
        <AnimatePresence>
          {editing && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditing(false)}
                className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
              >
                <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-foreground">✏️ Edit Trip</h2>
                    <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={editData.city}
                      onChange={e => setEditData(p => ({ ...p, city: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={editData.country}
                      onChange={e => setEditData(p => ({ ...p, country: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Start</label>
                        <input
                          type="date"
                          value={editData.startDate}
                          onChange={e => setEditData(p => ({ ...p, startDate: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">End</label>
                        <input
                          type="date"
                          value={editData.endDate}
                          onChange={e => setEditData(p => ({ ...p, endDate: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setEditData(p => ({ ...p, showOnProfile: !p.showOnProfile }))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                    >
                      {editData.showOnProfile ? (
                        <Globe className="w-4 h-4 text-accent" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground flex-1 text-left">
                        {editData.showOnProfile ? 'Visible on profile' : 'Private trip'}
                      </span>
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
          onClick={() => openComposer({ prefillUserIds: trip.notifyUserIds })}
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
