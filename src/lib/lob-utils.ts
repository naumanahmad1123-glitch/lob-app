import { addDays, format } from 'date-fns';
import { LobCategory } from '@/data/types';

// ─── Category Keywords (single source of truth) ───

export const CATEGORY_KEYWORDS: Record<string, LobCategory> = {
  hoops: 'sports', basketball: 'sports', soccer: 'sports', football: 'sports',
  dinner: 'dinner', sushi: 'dinner', brunch: 'dinner', lunch: 'dinner', eat: 'dinner',
  coffee: 'coffee', cafe: 'coffee', cowork: 'coffee',
  gym: 'gym', workout: 'gym', lift: 'gym',
  chill: 'chill', hang: 'chill', hangout: 'chill', movie: 'chill',
  travel: 'travel', trip: 'travel', road: 'travel',
  padel: 'padel', tennis: 'padel',
};

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
// Parses a human-readable time string ("8pm", "7:30 am") combined with a day reference
// ("today", "tomorrow", "monday", etc.) into an ISO datetime string.

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

// ─── Detect category from free text ───

export function detectCategory(text: string): LobCategory | '' {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return cat;
  }
  return '';
}
