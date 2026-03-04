export type LobStatus = 'draft' | 'voting' | 'confirmed' | 'cancelled' | 'completed';
export type ResponseType = 'in' | 'maybe' | 'out';
export type LobCategory = 'sports' | 'dinner' | 'coffee' | 'gym' | 'chill' | 'travel' | 'padel' | 'other';
export type CalendarPrivacy = 'free-busy' | 'details';
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly';
export type WhenMode = 'specific' | 'flexible' | 'tbd';
export type FlexibleWindow = 'today' | 'this-week' | 'this-weekend' | 'next-week' | 'this-month';

export interface User {
  id: string;
  name: string;
  avatar: string;
  interests: string[];
  city?: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: User[];
  lastActivity: string;
  unreadCount: number;
}

export interface TimeOption {
  id: string;
  datetime: string;
  votes: string[]; // user ids
}

export interface LobResponse {
  userId: string;
  response: ResponseType;
  selectedTimeId?: string;
  comment?: string;
}

export interface LobComment {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  suggestedTime?: string; // ISO datetime if this is a time suggestion
}

export interface Lob {
  id: string;
  title: string;
  category: LobCategory;
  groupId: string;
  groupName: string;
  createdBy: string;
  location?: string;
  description?: string;
  timeOptions: TimeOption[];
  selectedTime?: string;
  quorum: number;
  capacity?: number;
  deadline?: string;
  recurrence?: RecurrenceType;
  comments?: LobComment[];
  whenMode?: WhenMode;
  flexibleWindow?: FlexibleWindow;
  status: LobStatus;
  responses: LobResponse[];
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  city: string;
  country: string;
  emoji: string;
  startDate: string;
  endDate: string;
  notifyUserIds: string[];
  showOnProfile: boolean;
}

export interface CalendarShare {
  id: string;
  ownerId: string;
  targetType: 'user' | 'group';
  targetId: string;
  privacy: CalendarPrivacy;
}

export const CATEGORY_CONFIG: Record<LobCategory, { label: string; emoji: string; defaultQuorum: number }> = {
  sports: { label: 'Sports', emoji: '🏀', defaultQuorum: 6 },
  dinner: { label: 'Dinner', emoji: '🍽️', defaultQuorum: 3 },
  coffee: { label: 'Coffee', emoji: '☕', defaultQuorum: 2 },
  gym: { label: 'Gym', emoji: '💪', defaultQuorum: 2 },
  chill: { label: 'Chill', emoji: '😎', defaultQuorum: 2 },
  travel: { label: 'Travel', emoji: '✈️', defaultQuorum: 2 },
  padel: { label: 'Padel', emoji: '🎾', defaultQuorum: 4 },
  other: { label: 'Other', emoji: '📌', defaultQuorum: 2 },
};

export const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'weekly', label: 'Every week' },
  { key: 'biweekly', label: 'Every 2 weeks' },
  { key: 'monthly', label: 'Every month' },
];

export const FLEXIBLE_WINDOW_OPTIONS: { key: FlexibleWindow; label: string; displayLabel: string }[] = [
  { key: 'today', label: '📅 Today', displayLabel: 'Sometime today' },
  { key: 'this-week', label: '🗓️ This week', displayLabel: 'Sometime this week' },
  { key: 'this-weekend', label: '🌅 This weekend', displayLabel: 'Sometime this weekend' },
  { key: 'next-week', label: '📆 Next week', displayLabel: 'Sometime next week' },
  { key: 'this-month', label: '📋 This month', displayLabel: 'Sometime this month' },
];
