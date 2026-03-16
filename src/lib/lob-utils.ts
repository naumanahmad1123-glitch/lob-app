import { addDays, format } from 'date-fns';
import { LobCategory, CATEGORY_CONFIG } from '@/data/types';

// ─── Category Keywords (single source of truth) ───

export const CATEGORY_KEYWORDS: Record<string, LobCategory> = {
  hoops: 'sports', basketball: 'sports', soccer: 'sports', football: 'sports',
  dinner: 'dinner', sushi: 'dinner', brunch: 'dinner', lunch: 'dinner', eat: 'dinner',
  coffee: 'coffee', cafe: 'coffee', cowork: 'coffee',
  gym: 'gym', workout: 'gym', lift: 'gym',
  chill: 'chill', hang: 'chill', hangout: 'chill', movie: 'chill',
  travel: 'travel', road: 'travel',
  padel: 'padel', tennis: 'padel',
  'group trip': 'group-trip', 'group-trip': 'group-trip',
};

// ─── Infer category + specific emoji from title ───

export function inferCategoryFromTitle(title: string): { category: LobCategory | ''; emoji: string } {
  const t = title.toLowerCase();
  if (/padel/i.test(t)) return { category: 'padel', emoji: '🎾' };
  if (/basketball/i.test(t)) return { category: 'sports', emoji: '🏀' };
  if (/soccer|football/i.test(t)) return { category: 'sports', emoji: '⚽' };
  if (/tennis/i.test(t)) return { category: 'sports', emoji: '🎾' };
  if (/golf/i.test(t)) return { category: 'sports', emoji: '⛳' };
  if (/surf/i.test(t)) return { category: 'sports', emoji: '🏄' };
  if (/ski|snowboard/i.test(t)) return { category: 'sports', emoji: '⛷️' };
  if (/climb/i.test(t)) return { category: 'sports', emoji: '🧗' };
  if (/yoga/i.test(t)) return { category: 'sports', emoji: '🧘' };
  if (/swim/i.test(t)) return { category: 'sports', emoji: '🏊' };
  if (/volleyball/i.test(t)) return { category: 'sports', emoji: '🏐' };
  if (/pickleball/i.test(t)) return { category: 'sports', emoji: '🏓' };
  if (/run|jog/i.test(t)) return { category: 'sports', emoji: '🏃' };
  if (/workout|exercise/i.test(t)) return { category: 'sports', emoji: '💪' };
  if (/gym|lift|weights/i.test(t)) return { category: 'gym', emoji: '💪' };
  if (/drinks|bar|cocktail|happy hour|beer|wine/i.test(t)) return { category: 'dinner', emoji: '🍻' };
  if (/lunch/i.test(t)) return { category: 'dinner', emoji: '🥗' };
  if (/brunch/i.test(t)) return { category: 'dinner', emoji: '🥞' };
  if (/breakfast/i.test(t)) return { category: 'dinner', emoji: '🍳' };
  if (/pizza/i.test(t)) return { category: 'dinner', emoji: '🍕' };
  if (/sushi/i.test(t)) return { category: 'dinner', emoji: '🍣' };
  if (/taco/i.test(t)) return { category: 'dinner', emoji: '🌮' };
  if (/bbq|barbecue|grill/i.test(t)) return { category: 'dinner', emoji: '🔥' };
  if (/dinner|restaurant|eat|food/i.test(t)) return { category: 'dinner', emoji: '🍽️' };
  if (/coffee|café|cafe/i.test(t)) return { category: 'coffee', emoji: '☕' };
  if (/beach/i.test(t)) return { category: 'travel', emoji: '🏖️' };
  if (/hike|hiking/i.test(t)) return { category: 'travel', emoji: '🥾' };
  if (/camp/i.test(t)) return { category: 'travel', emoji: '⛺' };
  if (/lake|park|outdoor/i.test(t)) return { category: 'travel', emoji: '🌲' };
  if (/road trip|travel|explore|adventure|trip/i.test(t)) return { category: 'travel', emoji: '✈️' };
  if (/movie|film/i.test(t)) return { category: 'chill', emoji: '🎬' };
  if (/concert|music|show/i.test(t)) return { category: 'chill', emoji: '🎵' };
  if (/game night|board game/i.test(t)) return { category: 'chill', emoji: '🎲' };
  if (/karaoke/i.test(t)) return { category: 'chill', emoji: '🎤' };
  if (/study|cowork/i.test(t)) return { category: 'chill', emoji: '📚' };
  if (/chill|hang/i.test(t)) return { category: 'chill', emoji: '😎' };
  return { category: '', emoji: '' };
}

/** Get the best emoji for a lob title, falling back to category default */
export function getEmojiForTitle(title: string, category: LobCategory): string {
  const { emoji } = inferCategoryFromTitle(title);
  if (emoji) return emoji;
  return CATEGORY_CONFIG[category]?.emoji || '📌';
}

// ─── Day chips ───

export function generateDayChips(): { label: string; date: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    let label: string;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = format(d, 'EEE d');
    return { label, date: d };
  });
}

// ─── Time chips ───

export function generateTimeChips(): string[] {
  const chips: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      const d = new Date();
      d.setHours(h, m, 0, 0);
      chips.push(format(d, 'h:mm a'));
    }
  }
  return chips;
}

// ─── Same-day comparison ───

export function isSameDay(a: Date | undefined, b: Date): boolean {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Unified time parsing ───

export function parseTimeToISO(timeStr: string, dayStr: string = 'today'): string {
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!timeMatch) return '';

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2] || '0', 10);
  const meridiem = timeMatch[3].toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  const now = new Date();
  const targetDate = new Date(now);

  if (dayStr === 'tonight' || dayStr === 'today') {
    // today — no change
  } else if (dayStr === 'tomorrow') {
    targetDate.setDate(now.getDate() + 1);
  } else {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(dayStr.toLowerCase());
    if (dayIndex !== -1) {
      const currentDay = now.getDay();
      let daysUntil = dayIndex - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      targetDate.setDate(now.getDate() + daysUntil);
    }
  }

  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate.toISOString();
}

// ─── Parse a formatted time string like "8:30 PM" into hours/minutes ───

export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

// ─── Detect category from free text ───

export function detectCategory(text: string): LobCategory | '' {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return cat;
  }
  return '';
}