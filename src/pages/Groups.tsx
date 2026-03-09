import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { useAuth } from '@/contexts/AuthContext';

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allGroups = [], isLoading } = useSupabaseGroups();

  const friends = useMemo(() => {
    if (!user) return [];
    const friendMap = new Map<string, { user_id: string; name: string; avatar: string; groupCount: number }>();
    allGroups.forEach(g => {
      g.members.forEach(m => {
        if (m.user_id === user.id) return;
        const existing = friendMap.get(m.user_id);
        if (existing) {
          existing.groupCount++;
        } else {
          friendMap.set(m.user_id, { user_id: m.user_id, name: m.name, avatar: m.avatar, groupCount: 1 });
        }
      });
    });
    return Array.from(friendMap.values()).sort((a, b) => b.groupCount - a.groupCount);
  }, [allGroups, user]);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Groups</h1>
          <button
            onClick={() => navigate('/create-group')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Your Groups */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Your Groups</h2>
          {isLoading ? (
            <div className="text-center py-12"><p className="text-muted-foreground text-sm">Loading groups...</p></div>
          ) : allGroups.length === 0 ? (
            <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
              <span className="text-4xl mb-3 block">👥</span>
              <p className="text-sm font-semibold text-foreground">No groups yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a group to start making plans!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allGroups.map((group, i) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                        {group.emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-[15px]">{group.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.members.length} members
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-center gap-1 mt-3">
                    {group.members.slice(0, 5).map((m) => (
                      <span
                        key={m.id}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm"
                      >
                        {m.avatar}
                      </span>
                    ))}
                    {group.members.length > 5 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{group.members.length - 5}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Friends & Connections */}
        {!isLoading && friends.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-bold text-foreground">Friends & Connections</h2>
              <span className="text-xs text-muted-foreground ml-auto">{friends.length} people</span>
            </div>
            <div className="space-y-2">
              {friends.map((friend, i) => (
                <motion.div
                  key={friend.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/user/${friend.user_id}`)}
                  className="gradient-card rounded-2xl px-4 py-3 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                      {friend.avatar}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-[15px] truncate">{friend.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {friend.groupCount} shared group{friend.groupCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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

export default Groups;
