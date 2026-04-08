import { motion } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';

const Groups = () => {
  const navigate = useNavigate();
  const { data: allGroups = [], isLoading } = useSupabaseGroups();

  return (
    <AppLayout>
      <div className="w-full px-4">
        <div className="flex items-center justify-between pt-3 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Groups</h1>
          <button
            onClick={() => navigate('/create-group')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </div>

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
                      <span key={m.id} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">
                        {m.avatar}
                      </span>
                    ))}
                    {group.members.length > 5 && (
                      <span className="text-xs text-muted-foreground ml-1">+{group.members.length - 5}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Groups;
