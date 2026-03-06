import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { lobs as seedLobs, lobHistory, currentUser } from '@/data/seed';
import { CATEGORY_CONFIG, LobCategory } from '@/data/types';
import { useComposer } from '@/hooks/useComposer';
import { useCreatedLobs } from '@/hooks/useCreatedLobs';
import { useLobsterSuggests } from '@/hooks/useLobsterSuggests';

const categories = Object.entries(CATEGORY_CONFIG) as [LobCategory, typeof CATEGORY_CONFIG[LobCategory]][];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState<LobCategory | null>(null);
  const { openComposer } = useComposer();
  const createdLobs = useCreatedLobs();
  const allLobs = useMemo(() => [...createdLobs, ...seedLobs, ...lobHistory], [createdLobs]);
  const suggestions = useLobsterSuggests(allLobs, currentUser.id);

  const filtered = activeCategory
    ? suggestions.filter(s => s.category === activeCategory)
    : suggestions;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Explore</h1>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Filter className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Categories */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Browse by Category</h2>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(prev => prev === key ? null : key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  activeCategory === key
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'bg-card border-border/50 hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{val.emoji}</span>
                <span className={`text-[11px] font-medium ${activeCategory === key ? 'text-primary' : 'text-muted-foreground'}`}>
                  {val.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Suggestions from history */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Lobster's Picks</h2>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="ml-auto text-xs font-semibold text-primary"
              >
                Show all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {filtered.length > 0 ? filtered.map((s, i) => (
              <motion.button
                key={`${s.category}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => openComposer({ prefillText: s.title })}
                className="w-full text-left gradient-card rounded-2xl p-4 border border-border/50 shadow-card active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{s.emoji}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.timeHint ? `${s.timeHint} · ` : ''}Tap to lob it
                    </p>
                  </div>
                </div>
              </motion.button>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {suggestions.length === 0
                  ? 'Create a few more lobs to unlock personalized suggestions'
                  : 'No suggestions for this category yet'}
              </div>
            )}
          </div>
        </section>

        {/* Venue placeholder */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Nearby Venues</h2>
          </div>
          <div className="gradient-card rounded-2xl p-8 border border-border/50 shadow-card flex flex-col items-center text-center">
            <span className="text-4xl mb-3">📍</span>
            <p className="text-sm font-semibold text-foreground">Coming Soon</p>
            <p className="text-xs text-muted-foreground mt-1">Venue suggestions based on your interests and location</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Explore;
