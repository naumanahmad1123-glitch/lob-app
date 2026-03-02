import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, Search, MapPin, Star, Clock, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { suggestedLobs } from '@/data/seed';
import { CATEGORY_CONFIG, LobCategory } from '@/data/types';
import { LobComposer } from '@/components/lob/LobComposer';
import { LobSentToast } from '@/components/lob/LobSentToast';

const categories = Object.entries(CATEGORY_CONFIG) as [LobCategory, typeof CATEGORY_CONFIG[LobCategory]][];

// Mock venue data
const venues = [
  { id: 'v1', name: 'Sunset Park Courts', type: 'Sports', emoji: '🏀', rating: 4.5, distance: '0.3 mi', address: '41st St & 5th Ave, Brooklyn' },
  { id: 'v2', name: 'Nobu Downtown', type: 'Restaurant', emoji: '🍣', rating: 4.7, distance: '1.2 mi', address: '195 Broadway, Manhattan' },
  { id: 'v3', name: 'Blue Bottle Coffee', type: 'Café', emoji: '☕', rating: 4.4, distance: '0.5 mi', address: '76 N 4th St, Brooklyn' },
  { id: 'v4', name: 'Urban Padel Club', type: 'Sports', emoji: '🎾', rating: 4.6, distance: '2.1 mi', address: '34 Berry St, Brooklyn' },
  { id: 'v5', name: 'The Rooftop Bar', type: 'Bar', emoji: '🍸', rating: 4.3, distance: '0.8 mi', address: '60 Furman St, Brooklyn' },
  { id: 'v6', name: 'Prospect Park', type: 'Park', emoji: '🌳', rating: 4.8, distance: '0.4 mi', address: 'Prospect Park, Brooklyn' },
];

const venueTypes = ['All', 'Sports', 'Restaurant', 'Café', 'Bar', 'Park'];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeCategory, setActiveCategory] = useState<LobCategory | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [prefillText, setPrefillText] = useState('');
  const [showToast, setShowToast] = useState(false);

  const filteredVenues = venues.filter(v => {
    const matchesType = activeType === 'All' || v.type === activeType;
    const matchesSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredSuggestions = activeCategory
    ? suggestedLobs.filter(s => s.category === activeCategory)
    : suggestedLobs;

  const handleSuggestionTap = (title: string) => {
    setPrefillText(title);
    setComposerOpen(true);
  };

  const handleVenueDirections = (venue: typeof venues[0]) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`;
    window.open(url, '_blank');
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-4">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Explore</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search venues, places..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Venue Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {venueTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Nearby Venues */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Nearby Venues</h2>
            <span className="ml-auto text-xs text-muted-foreground">{filteredVenues.length} found</span>
          </div>
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filteredVenues.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{venue.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-[15px] truncate">{venue.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground shrink-0">
                          {venue.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          {venue.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {venue.distance}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{venue.address}</p>
                    </div>
                    <button
                      onClick={() => handleVenueDirections(venue)}
                      className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredVenues.length === 0 && (
              <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
                <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No venues found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search or filter</p>
              </div>
            )}
          </div>
        </section>

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

        {/* Suggestions */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Lobster's Picks</h2>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="ml-auto text-xs font-semibold text-primary">
                Show all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {filteredSuggestions.length > 0 ? filteredSuggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => handleSuggestionTap(s.title)}
                className="w-full text-left gradient-card rounded-2xl p-4 border border-border/50 shadow-card active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{s.emoji}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.time} · Tap to lob it</p>
                  </div>
                </div>
              </motion.button>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No suggestions for this category yet
              </div>
            )}
          </div>
        </section>
      </div>

      <LobComposer
        open={composerOpen}
        onClose={() => { setComposerOpen(false); setPrefillText(''); }}
        onLobSent={() => { setShowToast(true); setTimeout(() => setShowToast(false), 2500); }}
        prefillText={prefillText}
      />
      <LobSentToast show={showToast} />
    </AppLayout>
  );
};

export default Explore;
