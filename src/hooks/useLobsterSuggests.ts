import { useMemo } from 'react';
import { Lob, LobCategory, CATEGORY_CONFIG } from '@/data/types';

export interface LobSuggestion {
  title: string;
  category: LobCategory;
  emoji: string;
  timeHint?: string; // e.g. "Saturday morning"
  prefillTime?: string; // day string for composer
}

const MIN_LOBS_FOR_SUGGESTIONS = 3;
const MIN_PATTERN_COUNT = 2; // need at least 2 occurrences on same day/period to show time

function getPeriod(hour: number): string {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Analyzes a user's lob history and produces personalized suggestions
 * based on activity frequency and day/time patterns.
 */
export function useLobsterSuggests(userLobs: Lob[], userId: string): LobSuggestion[] {
  return useMemo(() => {
    // Filter to lobs this user created or responded 'in' to
    const relevant = userLobs.filter(
      l => l.createdBy === userId ||
        l.responses.some(r => r.userId === userId && r.response === 'in')
    );

    if (relevant.length < MIN_LOBS_FOR_SUGGESTIONS) return [];

    // Group by category (excluding group-trip which has its own flow)
    const byCat = new Map<LobCategory, { lob: Lob; datetime?: Date }[]>();

    for (const lob of relevant) {
      if (lob.category === 'group-trip') continue;
      const cat = lob.category as LobCategory;
      if (!byCat.has(cat)) byCat.set(cat, []);
      const timeStr = lob.selectedTime || lob.timeOptions[0]?.datetime;
      byCat.get(cat)!.push({
        lob,
        datetime: timeStr ? new Date(timeStr) : undefined,
      });
    }

    const suggestions: LobSuggestion[] = [];

    // Sort categories by frequency
    const sorted = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [cat, entries] of sorted) {
      if (entries.length < 1) continue;
      const config = CATEGORY_CONFIG[cat];
      if (!config) continue;

      // Find day/time pattern
      const dayPeriodCounts = new Map<string, number>();
      for (const entry of entries) {
        if (!entry.datetime) continue;
        const dayName = DAY_NAMES[entry.datetime.getDay()];
        const period = getPeriod(entry.datetime.getHours());
        const key = `${dayName} ${period}`;
        dayPeriodCounts.set(key, (dayPeriodCounts.get(key) || 0) + 1);
      }

      // Find most common pattern
      let timeHint: string | undefined;
      let bestCount = 0;
      for (const [pattern, count] of dayPeriodCounts) {
        if (count >= MIN_PATTERN_COUNT && count > bestCount) {
          bestCount = count;
          timeHint = pattern;
        }
      }

      // Use the most common title for this category
      const titleCounts = new Map<string, number>();
      for (const entry of entries) {
        titleCounts.set(entry.lob.title, (titleCounts.get(entry.lob.title) || 0) + 1);
      }
      const bestTitle = [...titleCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

      suggestions.push({
        title: bestTitle,
        category: cat,
        emoji: config.emoji,
        timeHint,
      });
    }

    return suggestions.slice(0, 5);
  }, [userLobs, userId]);
}
