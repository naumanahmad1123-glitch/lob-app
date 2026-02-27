import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { groups, lobs } from '@/data/seed';
import { LobCard } from '@/components/lob/LobCard';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const group = groups.find(g => g.id === id);
  const groupLobs = lobs.filter(l => l.groupId === id);

  if (!group) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Group not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span>{group.emoji}</span> {group.name}
            </h1>
            <p className="text-xs text-muted-foreground">{group.members.length} members</p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        {/* Members */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 mb-4">
          {group.members.map(m => (
            <div key={m.id} className="flex flex-col items-center gap-1 min-w-[56px]">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                {m.avatar}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{m.name}</span>
            </div>
          ))}
        </div>

        {/* Lobs */}
        <h2 className="text-base font-bold text-foreground mb-3">Lobs</h2>
        {groupLobs.length > 0 ? (
          <div className="space-y-3">
            {groupLobs.map((lob, i) => (
              <LobCard key={lob.id} lob={lob} index={i} />
            ))}
          </div>
        ) : (
          <div className="gradient-card rounded-2xl p-8 border border-border/50 text-center">
            <span className="text-4xl mb-3 block">🏐</span>
            <p className="text-sm font-semibold text-foreground">No lobs yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to lob a plan!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GroupDetail;
