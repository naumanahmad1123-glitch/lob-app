import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LobCategory, CATEGORY_CONFIG } from '@/data/types';

export interface VibeChip {
  /** Display label shown on the chip, e.g. "🏀 Hoops" */
  label: string;
  /** The title/vibe string stored on the lob */
  title: string;
  /** Category key for backend */
  category: LobCategory;
  /** Whether this is the special "Other" chip */
  isOther?: boolean;
}

/** Keyword map: vibe title → search terms for auto-detect */
const VIBE_KEYWORDS: Record<string, string[]> = {
  Hoops: ['hoop', 'basketball', 'bball', 'pickup'],
  Coffee: ['coffee', 'café', 'cafe', 'latte', 'espresso', 'tea'],
  Dinner: ['dinner', 'lunch', 'brunch', 'eat', 'food', 'sushi', 'pizza', 'taco', 'bbq', 'restaurant', 'meal'],
  Padel: ['padel', 'paddle'],
  Gym: ['gym', 'workout', 'lift', 'crossfit', 'exercise', 'training', 'fitness'],
  Drinks: ['drink', 'bar', 'pub', 'beer', 'wine', 'cocktail', 'happy hour'],
  'Movie night': ['movie', 'film', 'netflix', 'cinema', 'watch'],
  Walk: ['walk', 'stroll', 'hike'],
};

/** Map well-known vibe titles to a category + emoji */
const KNOWN_VIBES: Record<string, { category: LobCategory; emoji: string }> = {
  Hoops: { category: 'sports', emoji: '🏀' },
  Coffee: { category: 'coffee', emoji: '☕' },
  Dinner: { category: 'dinner', emoji: '🍜' },
  Padel: { category: 'padel', emoji: '🎾' },
  Gym: { category: 'gym', emoji: '💪' },
  Drinks: { category: 'other', emoji: '🍹' },
  'Movie night': { category: 'chill', emoji: '🎬' },
  Walk: { category: 'other', emoji: '🚶' },
};

const DEFAULT_VIBES: VibeChip[] = [
  { label: '🏀 Hoops', title: 'Hoops', category: 'sports' },
  { label: '☕ Coffee', title: 'Coffee', category: 'coffee' },
  { label: '🍜 Dinner', title: 'Dinner', category: 'dinner' },
  { label: '🍹 Drinks', title: 'Drinks', category: 'other' },
  { label: '💪 Gym', title: 'Gym', category: 'gym' },
];

const MAX_CHIPS = 8;

function titleToChip(title: string, category: LobCategory): VibeChip {
  const known = KNOWN_VIBES[title];
  if (known) {
    return { label: `${known.emoji} ${title}`, title, category: known.category };
  }
  const catConf = CATEGORY_CONFIG[category];
  return { label: `${catConf?.emoji ?? '📌'} ${title}`, title, category };
}

export function usePersonalizedVibes(userId: string | undefined) {
  const { data: lobHistory } = useQuery({
    queryKey: ['user-vibe-history', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lobs')
        .select('title, category')
        .eq('created_by', userId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const chips = useMemo<VibeChip[]>(() => {
    if (!lobHistory || lobHistory.length === 0) return DEFAULT_VIBES;

    // Count frequency of each title
    const freq = new Map<string, { count: number; category: LobCategory }>();
    for (const lob of lobHistory) {
      const key = lob.title;
      const existing = freq.get(key);
      if (existing) {
        existing.count++;
      } else {
        freq.set(key, { count: 1, category: lob.category as LobCategory });
      }
    }

    // Sort by frequency desc
    const sorted = [...freq.entries()].sort((a, b) => b[1].count - a[1].count);

    const result: VibeChip[] = sorted
      .slice(0, MAX_CHIPS)
      .map(([t, { category }]) => titleToChip(t, category));

    return result.length > 0 ? result : DEFAULT_VIBES;
  }, [lobHistory]);

  return chips;
}

/**
 * Auto-detect the best matching vibe from a personalized chip list based on input text.
 * Returns the matching chip title or null (meaning "Other").
 */
export function detectVibeFromChips(text: string, chips: VibeChip[]): string | null {
  const lower = text.toLowerCase().trim();
  if (!lower) return null;

  // 1. Exact chip title match
  const exact = chips.find(c => c.title.toLowerCase() === lower);
  if (exact) return exact.title;

  // 2. Title contains (e.g. "Coffee run" → Coffee)
  const titleMatch = chips.find(c => lower.includes(c.title.toLowerCase()));
  if (titleMatch) return titleMatch.title;

  // 3. Keyword match against known keywords
  for (const chip of chips) {
    const keywords = VIBE_KEYWORDS[chip.title];
    if (keywords && keywords.some(kw => lower.includes(kw))) return chip.title;
  }

  return null;
}
