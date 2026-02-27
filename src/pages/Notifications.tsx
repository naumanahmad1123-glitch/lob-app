import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { lobs, users } from '@/data/seed';
import { CATEGORY_CONFIG } from '@/data/types';

interface Notification {
  id: string;
  type: 'response' | 'quorum' | 'new_lob' | 'reminder';
  title: string;
  body: string;
  emoji: string;
  time: string;
  lobId?: string;
  read: boolean;
}

const notifications: Notification[] = [
  {
    id: 'n1', type: 'response', title: 'Alex is in!',
    body: 'Friday Night Hoops', emoji: '😎', time: '2m ago', lobId: 'l1', read: false,
  },
  {
    id: 'n2', type: 'quorum', title: 'Quorum reached! 🎉',
    body: 'Sushi Thursday is confirmed', emoji: '🍽️', time: '1h ago', lobId: 'l2', read: false,
  },
  {
    id: 'n3', type: 'new_lob', title: 'New Lob from Casey',
    body: 'Morning Coffee + Cowork', emoji: '☕', time: '3h ago', lobId: 'l3', read: false,
  },
  {
    id: 'n4', type: 'response', title: 'Jordan said maybe',
    body: 'Padel Match', emoji: '🎾', time: '5h ago', lobId: 'l4', read: true,
  },
  {
    id: 'n5', type: 'reminder', title: 'Sushi Thursday is tonight!',
    body: 'Nobu Downtown at 7:30 PM', emoji: '🍣', time: '6h ago', lobId: 'l2', read: true,
  },
];

const typeIcon = {
  response: Users,
  quorum: CheckCircle2,
  new_lob: Sparkles,
  reminder: Clock,
};

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3 pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Notifications</h1>
        </div>

        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = typeIcon[n.type];
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => n.lobId && navigate(`/lob/${n.lobId}`)}
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
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                </div>
                <Icon className="w-4 h-4 text-muted-foreground/50 mt-1 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
