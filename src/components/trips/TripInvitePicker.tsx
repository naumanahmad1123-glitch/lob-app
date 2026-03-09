import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  tripId: string;
  existingMemberIds: string[];
}

export function TripInvitePicker({ open, onClose, tripId, existingMemberIds }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Get user's group members as "connections"
  const { data: connections = [] } = useQuery({
    queryKey: ['user-connections', user?.id],
    enabled: open && !!user,
    queryFn: async () => {
      // Get groups user is in
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);
      if (!myGroups?.length) return [];

      const groupIds = myGroups.map(g => g.group_id);
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds)
        .neq('user_id', user!.id);
      
      const uniqueIds = [...new Set((members || []).map(m => m.user_id))];
      if (!uniqueIds.length) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', uniqueIds);
      
      return (profiles || []).map(p => ({
        id: p.id,
        name: p.name || 'Unknown',
        avatar: p.avatar || '🙂',
      }));
    },
  });

  const available = useMemo(
    () => connections.filter(c => !existingMemberIds.includes(c.id)),
    [connections, existingMemberIds]
  );

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleInvite = async () => {
    if (!selected.length || saving) return;
    setSaving(true);
    try {
      const rows = selected.map(uid => ({ trip_id: tripId, user_id: uid, status: 'invited' }));
      const { error } = await supabase.from('trip_members').insert(rows);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      toast.success(`Invited ${selected.length} friend${selected.length > 1 ? 's' : ''}!`);
      setSelected([]);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' as any }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pt-4 max-h-[70vh] flex flex-col">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-foreground">👋 Invite Friends</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[45vh]">
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No connections to invite</p>
                ) : (
                  available.map(c => {
                    const isSelected = selected.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(c.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                        }`}
                      >
                        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                          {c.avatar}
                        </span>
                        <span className="flex-1 text-left text-sm font-semibold text-foreground">{c.name}</span>
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {selected.length > 0 && (
                <div style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                  <button
                    onClick={handleInvite}
                    disabled={saving}
                    className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Inviting...' : `Invite ${selected.length} Friend${selected.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
