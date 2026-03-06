import { User, Group, Lob, Trip, CalendarShare } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'You',
  avatar: '🙂',
  interests: ['sports', 'dinner', 'coffee'],
  city: 'New York',
  isPro: false,
};

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'Alex', avatar: '😎', interests: ['sports', 'gym'], city: 'New York' },
  { id: 'u3', name: 'Sam', avatar: '🤙', interests: ['dinner', 'coffee'], city: 'London' },
  { id: 'u4', name: 'Jordan', avatar: '🏄', interests: ['sports', 'travel'], city: 'London' },
  { id: 'u5', name: 'Taylor', avatar: '🎯', interests: ['padel', 'gym'], city: 'New York' },
  { id: 'u6', name: 'Morgan', avatar: '🎤', interests: ['dinner', 'chill'], city: 'Paris' },
  { id: 'u7', name: 'Riley', avatar: '🚀', interests: ['sports', 'coffee'], city: 'New York' },
  { id: 'u8', name: 'Casey', avatar: '🎨', interests: ['chill', 'travel'], city: 'London' },
];

export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Hoop Squad',
    emoji: '🏀',
    members: [users[0], users[1], users[3], users[4], users[6]],
    lastActivity: '2 min ago',
    unreadCount: 3,
  },
  {
    id: 'g2',
    name: 'Dinner Club',
    emoji: '🍷',
    members: [users[0], users[2], users[5], users[7]],
    lastActivity: '1 hr ago',
    unreadCount: 0,
  },
  {
    id: 'g3',
    name: 'Coffee Crew',
    emoji: '☕',
    members: [users[0], users[2], users[6]],
    lastActivity: '3 hrs ago',
    unreadCount: 1,
  },
  {
    id: 'g4',
    name: 'Padel Gang',
    emoji: '🎾',
    members: [users[0], users[1], users[4], users[3]],
    lastActivity: 'Yesterday',
    unreadCount: 0,
  },
];

export const lobs: Lob[] = [
  {
    id: 'l1',
    title: 'Friday Night Hoops',
    category: 'sports',
    groupId: 'g1',
    groupName: 'Hoop Squad',
    createdBy: 'u2',
    location: 'Sunset Park Courts',
    timeOptions: [
      { id: 't1', datetime: '2026-03-06T19:00', votes: ['u2', 'u3', 'u4'] },
      { id: 't2', datetime: '2026-03-06T20:00', votes: ['u1', 'u6'] },
    ],
    quorum: 6,
    deadline: '2026-03-06T18:00',
    recurrence: 'weekly',
    comments: [
      { id: 'c1', userId: 'u2', message: 'Who\'s bringing the ball?', createdAt: '2026-03-01T11:00' },
      { id: 'c2', userId: 'u4', message: 'I got it covered 🏀', createdAt: '2026-03-01T11:30' },
    ],
    status: 'voting',
    responses: [
      { userId: 'u2', response: 'in' },
      { userId: 'u3', response: 'in' },
      { userId: 'u4', response: 'in' },
      { userId: 'u6', response: 'maybe' },
    ],
    createdAt: '2026-03-01T10:00',
  },
  {
    id: 'l2',
    title: 'Sushi Thursday',
    category: 'dinner',
    groupId: 'g2',
    groupName: 'Dinner Club',
    createdBy: 'u1',
    location: 'Nobu Downtown',
    timeOptions: [
      { id: 't3', datetime: '2026-03-05T19:30', votes: ['u1', 'u2', 'u5'] },
    ],
    selectedTime: '2026-03-05T19:30',
    quorum: 3,
    status: 'confirmed',
    responses: [
      { userId: 'u1', response: 'in' },
      { userId: 'u2', response: 'in' },
      { userId: 'u5', response: 'in' },
      { userId: 'u7', response: 'out' },
    ],
    createdAt: '2026-03-01T14:00',
  },
  {
    id: 'l3',
    title: 'Morning Coffee + Cowork',
    category: 'coffee',
    groupId: 'g3',
    groupName: 'Coffee Crew',
    createdBy: 'u6',
    location: 'Blue Bottle Coffee',
    timeOptions: [
      { id: 't4', datetime: '2026-03-04T09:00', votes: ['u6'] },
    ],
    quorum: 2,
    deadline: '2026-03-03T20:00',
    status: 'voting',
    responses: [
      { userId: 'u6', response: 'in' },
    ],
    createdAt: '2026-03-01T08:00',
  },
  {
    id: 'l4',
    title: 'Padel Match',
    category: 'padel',
    groupId: 'g4',
    groupName: 'Padel Gang',
    createdBy: 'u4',
    location: 'Urban Padel Club',
    timeOptions: [
      { id: 't5', datetime: '2026-03-08T17:00', votes: ['u4', 'u1'] },
      { id: 't6', datetime: '2026-03-08T18:00', votes: ['u4'] },
    ],
    quorum: 4,
    deadline: '2026-03-07T12:00',
    status: 'voting',
    responses: [
      { userId: 'u4', response: 'in' },
      { userId: 'u1', response: 'in' },
    ],
    createdAt: '2026-03-01T12:00',
  },
  {
    id: 'l5',
    title: 'Weekend Brunch',
    category: 'dinner',
    groupId: 'g2',
    groupName: 'Dinner Club',
    createdBy: 'u5',
    location: 'The Smith',
    timeOptions: [
      { id: 't7', datetime: '2026-03-09T11:00', votes: ['u5', 'u1', 'u2'] },
    ],
    selectedTime: '2026-03-09T11:00',
    quorum: 3,
    status: 'confirmed',
    responses: [
      { userId: 'u5', response: 'in' },
      { userId: 'u1', response: 'in' },
      { userId: 'u2', response: 'in' },
    ],
    createdAt: '2026-03-02T09:00',
  },
  {
    id: 'l6',
    title: 'Pickup Soccer',
    category: 'sports',
    groupId: 'g1',
    groupName: 'Hoop Squad',
    createdBy: 'u3',
    location: 'Central Park Great Lawn',
    timeOptions: [
      { id: 't8', datetime: '2026-03-15T16:00', votes: ['u3', 'u4'] },
    ],
    quorum: 6,
    status: 'voting',
    responses: [
      { userId: 'u3', response: 'in' },
      { userId: 'u4', response: 'in' },
    ],
    createdAt: '2026-03-02T11:00',
  },
  {
    id: 'l7',
    title: 'Evening Run',
    category: 'sports',
    groupId: 'g1',
    groupName: 'Hoop Squad',
    createdBy: 'u1',
    location: 'Brooklyn Bridge Park',
    timeOptions: [
      { id: 't9', datetime: '2026-03-12T18:30', votes: ['u1', 'u6'] },
    ],
    quorum: 3,
    status: 'voting',
    responses: [
      { userId: 'u1', response: 'in' },
      { userId: 'u6', response: 'in' },
    ],
    createdAt: '2026-03-02T14:00',
  },
  {
    id: 'l8',
    title: 'Wine Tasting',
    category: 'dinner',
    groupId: 'g2',
    groupName: 'Dinner Club',
    createdBy: 'u2',
    location: 'Aldo Sohm Wine Bar',
    timeOptions: [
      { id: 't10', datetime: '2026-03-20T19:00', votes: ['u2', 'u5'] },
    ],
    quorum: 4,
    status: 'voting',
    responses: [
      { userId: 'u2', response: 'in' },
      { userId: 'u5', response: 'in' },
    ],
    createdAt: '2026-03-02T16:00',
  },
  {
    id: 'l9',
    title: 'Lisbon Summer Trip',
    category: 'group-trip',
    createdBy: 'u1',
    groupId: 'g1',
    groupName: 'Hoop Squad',
    tripStartDate: '2026-07-10',
    tripEndDate: '2026-07-17',
    location: 'Lisbon, Portugal',
    timeOptions: [
      { id: 't11', datetime: '2026-07-10T12:00', votes: ['u1', 'u2', 'u4'] },
    ],
    quorum: 4,
    status: 'voting',
    responses: [
      { userId: 'u1', response: 'in' },
      { userId: 'u2', response: 'in' },
      { userId: 'u4', response: 'in' },
      { userId: 'u5', response: 'maybe' },
    ],
    createdAt: '2026-03-03T10:00',
  },
];

// Historical lobs for u1 — used by Lobster Suggests to derive patterns
export const lobHistory: Lob[] = [
  // Hoops on Saturday mornings (pattern: Saturday morning)
  { id: 'h1', title: 'Saturday Hoops', category: 'sports', groupId: 'g1', groupName: 'Hoop Squad', createdBy: 'u1', location: 'Sunset Park Courts', timeOptions: [{ id: 'th1', datetime: '2026-02-08T10:00', votes: ['u1','u2'] }], quorum: 6, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-06T10:00' },
  { id: 'h2', title: 'Saturday Hoops', category: 'sports', groupId: 'g1', groupName: 'Hoop Squad', createdBy: 'u1', location: 'Sunset Park Courts', timeOptions: [{ id: 'th2', datetime: '2026-02-15T10:30', votes: ['u1','u4'] }], quorum: 6, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-13T10:00' },
  { id: 'h3', title: 'Saturday Hoops', category: 'sports', groupId: 'g1', groupName: 'Hoop Squad', createdBy: 'u1', location: 'Sunset Park Courts', timeOptions: [{ id: 'th3', datetime: '2026-02-22T09:30', votes: ['u1','u2','u4'] }], quorum: 6, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-20T10:00' },
  // Coffee on weekday mornings (pattern: various days, morning — no single day pattern)
  { id: 'h4', title: 'Coffee', category: 'coffee', groupId: 'g3', groupName: 'Coffee Crew', createdBy: 'u1', location: 'Blue Bottle', timeOptions: [{ id: 'th4', datetime: '2026-02-10T08:30', votes: ['u1'] }], quorum: 2, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-09T10:00' },
  { id: 'h5', title: 'Coffee', category: 'coffee', groupId: 'g3', groupName: 'Coffee Crew', createdBy: 'u1', location: 'Blue Bottle', timeOptions: [{ id: 'th5', datetime: '2026-02-18T09:00', votes: ['u1'] }], quorum: 2, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-17T10:00' },
  { id: 'h6', title: 'Coffee', category: 'coffee', groupId: 'g3', groupName: 'Coffee Crew', createdBy: 'u1', location: 'Blue Bottle', timeOptions: [{ id: 'th6', datetime: '2026-02-25T08:00', votes: ['u1','u6'] }], quorum: 2, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-24T10:00' },
  // Dinner on Thursday evenings (pattern: Thursday evening)
  { id: 'h7', title: 'Dinner', category: 'dinner', groupId: 'g2', groupName: 'Dinner Club', createdBy: 'u1', location: 'Nobu', timeOptions: [{ id: 'th7', datetime: '2026-02-06T19:30', votes: ['u1','u5'] }], quorum: 3, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-04T10:00' },
  { id: 'h8', title: 'Dinner', category: 'dinner', groupId: 'g2', groupName: 'Dinner Club', createdBy: 'u1', location: 'The Smith', timeOptions: [{ id: 'th8', datetime: '2026-02-13T20:00', votes: ['u1','u2'] }], quorum: 3, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-11T10:00' },
  { id: 'h9', title: 'Dinner', category: 'dinner', groupId: 'g2', groupName: 'Dinner Club', createdBy: 'u1', location: 'Carbone', timeOptions: [{ id: 'th9', datetime: '2026-02-20T19:00', votes: ['u1','u5','u7'] }], quorum: 3, status: 'completed', responses: [{ userId: 'u1', response: 'in' }], createdAt: '2026-02-18T10:00' },
];

export const trips: Trip[] = [
  {
    id: 'trip1',
    userId: 'u1',
    city: 'London',
    country: 'UK',
    emoji: '🇬🇧',
    startDate: '2026-03-10',
    endDate: '2026-03-15',
    notifyUserIds: ['u3', 'u4', 'u8'],
    showOnProfile: true,
  },
  {
    id: 'trip2',
    userId: 'u3',
    city: 'New York',
    country: 'US',
    emoji: '🇺🇸',
    startDate: '2026-03-05',
    endDate: '2026-03-08',
    notifyUserIds: ['u1', 'u2'],
    showOnProfile: true,
  },
];

export const calendarShares: CalendarShare[] = [
  { id: 'cs1', ownerId: 'u1', targetType: 'user', targetId: 'u2', privacy: 'details' },
  { id: 'cs2', ownerId: 'u1', targetType: 'user', targetId: 'u3', privacy: 'free-busy' },
  { id: 'cs3', ownerId: 'u1', targetType: 'group', targetId: 'g1', privacy: 'free-busy' },
];

// suggestedLobs removed — Lobster Suggests now derives from user history via useLobsterSuggests hook
