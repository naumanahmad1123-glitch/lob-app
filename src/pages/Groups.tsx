import { motion } from 'framer-motion';
import { Plus, ChevronRight, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { groups } from '@/data/seed';
import { useCreatedGroups } from '@/hooks/useCreatedGroups';

const Groups = () => {
  const navigate = useNavigate();
  const createdGroups = useCreatedGroups();
  const allGroups = [...createdGroups, ...groups];

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

        <div className="space-y-3">
          {allGroups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                    {group.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-[15px]">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.members.length} members · {group.lastActivity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {group.unreadCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Member avatars */}
              <div className="flex items-center gap-1 mt-3">
                {group.members.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm"
                  >
                    {m.avatar}
                  </div>
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
      </div>
    </AppLayout>
  );
};

export default Groups;
