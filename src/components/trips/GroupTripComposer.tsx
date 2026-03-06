import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, CalendarRange, MapPin, Minus, Plus } from 'lucide-react';
import { users, currentUser, groups } from '@/data/seed';
import { TappableAvatar } from '@/components/TappableAvatar';
import { Lob, CATEGORY_CONFIG } from '@/data/types';
import { lobStore } from '@/stores/lobStore';
import { toast } from 'sonner';

interface GroupTripComposerProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function GroupTripComposer({ open, onClose, onCreated }: GroupTripComposerProps) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datesTBD, setDatesTBD] = useState(false);
  const [headcount, setHeadcount] = useState(4);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const otherUsers = users.filter(u => u.id !== currentUser.id);

  const toggleUser = (uid: string) => {
    setSelectedUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const reset = () => {
    setDestination('');
    setStartDate('');
    setEndDate('');
    setDatesTBD(false);
    setHeadcount(4);
    setSelectedUserIds([]);
  };

  const handleCreate = () => {
    if (!destination.trim()) {
      toast.error('Where are you going?');
      return;
    }
    if (!datesTBD && (!startDate || !endDate)) {
      toast.error('Pick dates or mark as TBD');
      return;
    }

    const newLob: Lob = {
      id: `gt-${Date.now()}`,
      title: `Group Trip: ${destination.trim()}`,
      category: 'group-trip',
      groupId: '',
      groupName: selectedUserIds.length > 0
        ? `${selectedUserIds.length + 1} travellers`
        : 'Open trip',
      createdBy: currentUser.id,
      location: destination.trim(),
      destination: destination.trim(),
      tripStartDate: datesTBD ? undefined : startDate,
      tripEndDate: datesTBD ? undefined : endDate,
      description: datesTBD
        ? `Group trip to ${destination.trim()} — dates TBD`
        : `Group trip to ${destination.trim()}`,
      timeOptions: datesTBD
        ? []
        : [{ id: `to-${Date.now()}`, datetime: `${startDate}T12:00`, votes: [] }],
      whenMode: datesTBD ? 'tbd' : 'specific',
      quorum: headcount,
      status: 'voting',
      responses: [{ userId: currentUser.id, response: 'in' }],
      createdAt: new Date().toISOString(),
    };

    lobStore.addLob(newLob);
    toast.success(`Group trip to ${destination.trim()} lobbed! 🌍`);
    reset();
    onClose();
    onCreated?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <h2 className="text-lg font-extrabold text-foreground">Plan a Group Trip</h2>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Destination */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Where to?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lisbon, Bali, Lake Como"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>

                {/* Dates */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5" />
                    When?
                  </label>
                  <button
                    onClick={() => setDatesTBD(!datesTBD)}
                    className={`mb-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      datesTBD
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-secondary text-muted-foreground border border-border'
                    }`}
                  >
                    Dates TBD — let the group decide
                  </button>
                  {!datesTBD && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">From</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">To</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Headcount */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    How many to make it happen?
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setHeadcount(Math.max(2, headcount - 1))}
                      className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold text-foreground w-8 text-center">{headcount}</span>
                    <button
                      onClick={() => setHeadcount(Math.min(20, headcount + 1))}
                      className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">people needed</span>
                  </div>
                </div>

                {/* Invite people */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Who's invited?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {otherUsers.map(u => {
                      const selected = selectedUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleUser(u.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                            selected
                              ? 'bg-primary/15 text-primary border border-primary/30'
                              : 'bg-secondary text-muted-foreground border border-border'
                          }`}
                        >
                          <span className="text-sm">{u.avatar}</span>
                          {u.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleCreate}
                  className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm mt-2 active:scale-[0.98] transition-transform"
                >
                  🌍 Lob the Trip
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
