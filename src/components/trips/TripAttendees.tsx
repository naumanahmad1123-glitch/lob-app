import { motion } from 'framer-motion';
import { Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TripMember } from '@/hooks/useTripDetail';

interface Props {
  members: TripMember[];
  isOwner: boolean;
  onInvite: () => void;
}

export function TripAttendees({ members, isOwner, onInvite }: Props) {
  const navigate = useNavigate();
  const going = members.filter(m => m.status === 'going');
  const invited = members.filter(m => m.status === 'invited');

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">Attendees</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {going.length} of {members.length} going
        </span>
      </div>

      {members.length === 0 ? (
        <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
          <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No one invited yet — bring the crew</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <motion.div
              key={m.id}
              onClick={() => navigate(`/user/${m.user_id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer active:scale-[0.98] hover:border-primary/30 transition-all"
            >
              <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                {m.avatar}
              </span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                m.status === 'going'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {m.status === 'going' ? '✓ Going' : 'Invited'}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {isOwner && (
        <button
          onClick={onInvite}
          className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all cursor-pointer active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Invite Friends
        </button>
      )}
    </motion.section>
  );
}
