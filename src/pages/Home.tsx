import { motion } from 'framer-motion';
import { Sparkles, Bell, ChevronUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { lobs, suggestedLobs } from '@/data/seed';

const Home = () => {
  const activeLobs = lobs.filter(l => l.status === 'voting');
  const confirmedLobs = lobs.filter(l => l.status === 'confirmed');

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Lob</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Make plans, not excuses</p>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              3
            </span>
          </button>
        </div>

        {/* Active Lobs */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Needs Your Vote</h2>
            <span className="text-xs font-semibold text-primary">{activeLobs.length} active</span>
          </div>
          <div className="space-y-3">
            {activeLobs.map((lob, i) => (
              <LobCard key={lob.id} lob={lob} index={i} />
            ))}
          </div>
        </section>

        {/* Confirmed */}
        {confirmedLobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-3">Upcoming</h2>
            <div className="space-y-3">
              {confirmedLobs.map((lob, i) => (
                <LobCard key={lob.id} lob={lob} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* AI Suggestions */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Lobster Suggests</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {suggestedLobs.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="min-w-[160px] gradient-card border border-border/50 rounded-2xl p-4 shadow-card cursor-pointer active:scale-[0.97] transition-transform"
              >
                <span className="text-2xl">{s.emoji}</span>
                <p className="text-sm font-semibold text-foreground mt-2 leading-tight">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.time}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Swipe-up hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col items-center pb-4 text-muted-foreground"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronUp className="w-5 h-5" />
          </motion.div>
          <span className="text-xs font-medium">Swipe up to Lob it</span>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Home;
