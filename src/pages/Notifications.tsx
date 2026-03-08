import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users, Clock, Sparkles, BellOff, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

const typeIcon: Record<string, typeof Users> = {
  response: Users,
  quorum: CheckCircle2,
  new_lob: Sparkles,
  reminder: Clock,
  info: Sparkles,
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useNotifications();

  const handleTap = async (n: AppNotification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    if (n.lob_id) navigate(`/lob/${n.lob_id}`);
    else if (n.trip_id) navigate(`/trips/${n.trip_id}`);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3 pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex-1">Notifications</h1>
          {hasUnread && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
            <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">You'll get notified when someone responds to your lobs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const Icon = typeIcon[n.type] || Sparkles;
              const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleTap(n)}
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                    n.read
                      ? 'bg-card border-border/30'
                      : 'gradient-card border-primary/20 shadow-card'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{n.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo}</p>
                  </div>
                  <Icon className="w-4 h-4 text-muted-foreground/50 mt-1 flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
