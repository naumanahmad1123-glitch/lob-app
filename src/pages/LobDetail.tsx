import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Share2, MessageCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { lobs, users } from '@/data/seed';
import { CATEGORY_CONFIG, ResponseType } from '@/data/types';
import { ResponseButtons } from '@/components/lob/ResponseButtons';
import { QuorumRing } from '@/components/lob/QuorumRing';
import { StatusPill } from '@/components/lob/StatusPill';

const LobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const lob = lobs.find(l => l.id === id);
  const [myResponse, setMyResponse] = useState<ResponseType | undefined>(
    lob?.responses.find(r => r.userId === 'u1')?.response
  );

  if (!lob) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Lob not found</p>
        </div>
      </AppLayout>
    );
  }

  const config = CATEGORY_CONFIG[lob.category];
  const inList = lob.responses.filter(r => r.response === 'in');
  const inCount = myResponse === 'in' ? inList.length + (inList.find(r => r.userId === 'u1') ? 0 : 1) : inList.length;
  const quorumReached = inCount >= lob.quorum;

  const timeStr = lob.selectedTime || lob.timeOptions[0]?.datetime;
  const formattedTime = timeStr
    ? new Date(timeStr).toLocaleString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'TBD';

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';
  const getUserAvatar = (userId: string) => users.find(u => u.id === userId)?.avatar || '👤';

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <StatusPill status={lob.status} />
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">{lob.title}</h1>
              <p className="text-sm text-muted-foreground">{lob.groupName}</p>
            </div>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{formattedTime}</span>
          </div>
          {lob.location && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{lob.location}</span>
            </div>
          )}
        </motion.div>

        {/* Quorum Banner */}
        {quorumReached && lob.status === 'voting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 bg-lob-confirmed/10 border border-lob-confirmed/30 mb-4 flex items-center gap-3"
          >
            <CheckCircle2 className="w-6 h-6 text-lob-confirmed" />
            <div>
              <p className="font-bold text-foreground text-sm">Quorum reached!</p>
              <p className="text-xs text-muted-foreground">Ready to confirm this plan</p>
            </div>
          </motion.div>
        )}

        {/* Response Buttons */}
        {lob.status === 'voting' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4"
          >
            <ResponseButtons current={myResponse} onChange={setMyResponse} />
          </motion.div>
        )}

        {/* Quorum Ring + Avatar Stacks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-card rounded-2xl p-5 border border-border/50 shadow-card mb-4"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-4">ATTENDANCE</p>
          <QuorumRing current={inCount} target={lob.quorum} responses={lob.responses} />
        </motion.div>

        {/* Time Poll */}
        {lob.timeOptions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card mb-4"
          >
            <p className="text-xs font-semibold text-muted-foreground mb-3">TIME POLL</p>
            <div className="space-y-2">
              {lob.timeOptions.map(opt => {
                const t = new Date(opt.datetime);
                return (
                  <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <span className="text-sm font-medium text-foreground">
                      {t.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {opt.votes.slice(0, 3).map(uid => (
                          <span key={uid} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card">
                            {getUserAvatar(uid)}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{opt.votes.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Chat CTA */}
        <button className="w-full py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2 mb-6">
          <MessageCircle className="w-4 h-4" />
          Open Chat
        </button>
      </div>
    </AppLayout>
  );
};

export default LobDetail;
