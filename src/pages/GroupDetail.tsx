import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComposer } from '@/hooks/useComposer';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openComposer } = useComposer();
  const { data: allGroups = [] } = useSupabaseGroups();
  const { data: allLobs = [] } = useSupabaseLobs();

  const group = allGroups.find(g => g.id === id);
  const groupLobs = useMemo(() => allLobs.filter(l => l.groupId === id), [allLobs, id]);

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
      <div className="w-full px-4">
        <div className="flex items-center gap-3 pt-2 pb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span>{group.emoji}</span> {group.name}
            </h1>
            <p className="text-xs text-muted-foreground">{group.members.length} members</p>
          </div>
          <button
            onClick={() => openComposer()}
            className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        {/* Members */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 mb-2">
          {group.members.map(m => (
            <button
              key={m.id}
              onClick={() => navigate(`/user/${m.user_id}`)}
              className="flex flex-col items-center gap-1 min-w-[56px] cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                {m.avatar}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{m.name}</span>
            </button>
          ))}
        </div>

        {/* Lobs */}
        <h2 className="text-sm font-bold text-foreground mb-2">Lobs</h2>
        {groupLobs.length > 0 ? (
          <div className="space-y-2">
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
