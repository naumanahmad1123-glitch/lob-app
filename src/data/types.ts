export type LobStatus = 'draft' | 'voting' | 'confirmed' | 'cancelled' | 'completed';
export type ResponseType = 'in' | 'maybe' | 'out' | 'standby';
export type LobCategory = 'sports' | 'dinner' | 'coffee' | 'gym' | 'chill' | 'travel' | 'padel' | 'group-trip' | 'other';
export type CalendarPrivacy = 'free-busy' | 'details';
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly';
export type WhenMode = 'specific' | 'flexible' | 'tbd';
export type FlexibleWindow = 'today' | 'tomorrow' | 'this-week' | 'this-weekend' | 'next-week' | 'this-month';
export type TripPlanningMode = 'defined' | 'dates-open' | 'fully-open';
export type TripVibe = 'beach' | 'city' | 'adventure' | 'ski' | 'cultural' | 'roadtrip';
export type TripPlanningPhase = 'voting-destination' | 'voting-dates' | 'confirmed';

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
  standbySince?: number; // timestamp ms — used to order standby queue
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
  locationName?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
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
  // Open Invite
  openInviteEnabled?: boolean;
  openInviteMaxGuests?: number;
  openInviteUsedGuests?: number;
  // Fill a Seat
  fillASeatActive?: boolean;
  fillASeatSpots?: number;
  // Group Trip fields
  destination?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  tripPlanningMode?: TripPlanningMode;
  tripPlanningPhase?: TripPlanningPhase;
  tripTimeframe?: string;
  tripBudget?: string;
  tripVibes?: TripVibe[];
  destinationOptions?: { id: string; name: string; votes: string[] }[];
  dateRangeOptions?: { id: string; startDate: string; endDate: string; votes: string[] }[];
  lastNudgedAt?: string;
}

export interface GuestInvite {
  id: string;
  lobId: string;
  invitedBy: string;
  invitedUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface FillASeatRequest {
  id: string;
  lobId: string;
  requesterId: string;
  status: 'pending' | 'accepted' | 'declined';
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
  'group-trip': { label: 'Group Trip', emoji: '🌍', defaultQuorum: 4 },
  other: { label: 'Other', emoji: '📌', defaultQuorum: 2 },
};

export const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string }[] = [
  { key: 'weekly', label: 'Every week' },
  { key: 'biweekly', label: 'Every 2 weeks' },
  { key: 'monthly', label: 'Every month' },
];

export const FLEXIBLE_WINDOW_OPTIONS: { key: FlexibleWindow; label: string; displayLabel: string }[] = [
  { key: 'today', label: '📅 Today', displayLabel: 'Sometime today' },
  { key: 'tomorrow', label: '📆 Tomorrow', displayLabel: 'Sometime tomorrow' },
  { key: 'this-week', label: '🗓️ This week', displayLabel: 'Sometime this week' },
  { key: 'this-weekend', label: '🌅 This weekend', displayLabel: 'Sometime this weekend' },
  { key: 'next-week', label: '📆 Next week', displayLabel: 'Sometime next week' },
  { key: 'this-month', label: '📋 This month', displayLabel: 'Sometime this month' },
];
