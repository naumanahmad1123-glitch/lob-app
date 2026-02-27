export type LobStatus = 'draft' | 'voting' | 'confirmed' | 'cancelled' | 'completed';
export type ResponseType = 'in' | 'maybe' | 'out';
export type LobCategory = 'sports' | 'dinner' | 'coffee' | 'gym' | 'chill' | 'travel' | 'padel' | 'other';

export interface User {
  id: string;
  name: string;
  avatar: string;
  interests: string[];
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
  status: LobStatus;
  responses: LobResponse[];
  createdAt: string;
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
