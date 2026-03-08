import { supabase } from '@/integrations/supabase/client';

let seeded = false;

export async function seedDemoData(userId: string) {
  if (seeded) return;
  seeded = true;

  // Check if user already has groups
  const { data: existingGroups } = await supabase
    .from('group_members')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existingGroups && existingGroups.length > 0) return;

  // Create demo groups
  const groups = [
    { name: 'Hoop Squad', emoji: '🏀', created_by: userId },
    { name: 'Dinner Club', emoji: '🍷', created_by: userId },
    { name: 'Coffee Crew', emoji: '☕', created_by: userId },
  ];

  const { data: createdGroups, error: gErr } = await supabase
    .from('groups')
    .insert(groups)
    .select();

  if (gErr || !createdGroups) return;

  // Create fake member profiles
  const fakeMembers = [
    { name: 'Alex', avatar: '😎', interests: ['sports', 'gym'], city: 'New York' },
    { name: 'Sam', avatar: '🤙', interests: ['dinner', 'coffee'], city: 'London' },
    { name: 'Jordan', avatar: '🏄', interests: ['sports', 'travel'], city: 'London' },
    { name: 'Taylor', avatar: '🎯', interests: ['padel', 'gym'], city: 'New York' },
    { name: 'Casey', avatar: '🎨', interests: ['chill', 'travel'], city: 'London' },
    { name: 'Morgan', avatar: '🎤', interests: ['dinner', 'chill'], city: 'Paris' },
  ];

  const fakeIds: string[] = [];
  for (const member of fakeMembers) {
    const fakeId = crypto.randomUUID();
    fakeIds.push(fakeId);
    await supabase.from('profiles').insert({
      id: fakeId,
      name: member.name,
      avatar: member.avatar,
      interests: member.interests,
      city: member.city,
    });
  }

  // Add user + fake members to groups
  const memberships = [
    // User in all groups
    ...createdGroups.map(g => ({ group_id: g.id, user_id: userId })),
    // Hoop Squad: Alex, Jordan, Taylor, Morgan
    { group_id: createdGroups[0].id, user_id: fakeIds[0] },
    { group_id: createdGroups[0].id, user_id: fakeIds[2] },
    { group_id: createdGroups[0].id, user_id: fakeIds[3] },
    { group_id: createdGroups[0].id, user_id: fakeIds[5] },
    // Dinner Club: Sam, Casey, Morgan
    { group_id: createdGroups[1].id, user_id: fakeIds[1] },
    { group_id: createdGroups[1].id, user_id: fakeIds[4] },
    { group_id: createdGroups[1].id, user_id: fakeIds[5] },
    // Coffee Crew: Sam, Alex, Taylor
    { group_id: createdGroups[2].id, user_id: fakeIds[1] },
    { group_id: createdGroups[2].id, user_id: fakeIds[0] },
    { group_id: createdGroups[2].id, user_id: fakeIds[3] },
  ];
  await supabase.from('group_members').insert(memberships);

  // Create demo lobs
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const lobs = [
    {
      title: 'Friday Night Hoops',
      category: 'sports',
      group_id: createdGroups[0].id,
      group_name: 'Hoop Squad',
      created_by: userId,
      location: 'Sunset Park Courts',
      quorum: 4,
      status: 'voting',
    },
    {
      title: 'Sushi Thursday',
      category: 'dinner',
      group_id: createdGroups[1].id,
      group_name: 'Dinner Club',
      created_by: userId,
      location: 'Nobu Downtown',
      quorum: 3,
      status: 'voting',
    },
    {
      title: 'Morning Coffee + Cowork',
      category: 'coffee',
      group_id: createdGroups[2].id,
      group_name: 'Coffee Crew',
      created_by: userId,
      location: 'Blue Bottle Coffee',
      quorum: 2,
      status: 'voting',
    },
    {
      title: 'Padel Doubles',
      category: 'padel',
      group_id: createdGroups[0].id,
      group_name: 'Hoop Squad',
      created_by: fakeIds[0], // Alex created this one
      location: 'NYC Padel Club',
      quorum: 4,
      status: 'voting',
    },
    {
      title: 'Rooftop Drinks',
      category: 'chill',
      group_id: createdGroups[1].id,
      group_name: 'Dinner Club',
      created_by: fakeIds[1], // Sam created
      location: 'Westlight Brooklyn',
      quorum: 3,
      status: 'confirmed',
    },
    {
      title: 'Sunday Gym Session',
      category: 'gym',
      group_id: createdGroups[0].id,
      group_name: 'Hoop Squad',
      created_by: fakeIds[3], // Taylor created
      location: 'Equinox SoHo',
      quorum: 2,
      status: 'voting',
    },
  ];

  const { data: createdLobs, error: lErr } = await supabase
    .from('lobs')
    .insert(lobs)
    .select();

  if (lErr || !createdLobs) return;

  // Add time options for each lob
  const timeOptions = createdLobs.map((l, i) => ({
    lob_id: l.id,
    datetime: new Date(tomorrow.getTime() + i * 3600000 + 18 * 3600000).toISOString(),
  }));
  // Add second time option for some lobs
  timeOptions.push(
    { lob_id: createdLobs[0].id, datetime: new Date(dayAfter.getTime() + 19 * 3600000).toISOString() },
    { lob_id: createdLobs[3].id, datetime: new Date(dayAfter.getTime() + 10 * 3600000).toISOString() },
  );
  await supabase.from('lob_time_options').insert(timeOptions);

  // RSVP the user as "in" for a couple lobs
  await supabase.from('lob_responses').insert([
    { lob_id: createdLobs[0].id, user_id: userId, response: 'in' },
    { lob_id: createdLobs[4].id, user_id: userId, response: 'in' },
  ]);

  // Fake member RSVPs to make lobs feel alive
  await supabase.from('lob_responses').insert([
    { lob_id: createdLobs[0].id, user_id: fakeIds[0], response: 'in' },
    { lob_id: createdLobs[0].id, user_id: fakeIds[2], response: 'in' },
    { lob_id: createdLobs[0].id, user_id: fakeIds[3], response: 'maybe' },
    { lob_id: createdLobs[1].id, user_id: fakeIds[1], response: 'in' },
    { lob_id: createdLobs[1].id, user_id: fakeIds[4], response: 'maybe' },
    { lob_id: createdLobs[2].id, user_id: fakeIds[1], response: 'in' },
    { lob_id: createdLobs[3].id, user_id: fakeIds[0], response: 'in' },
    { lob_id: createdLobs[3].id, user_id: fakeIds[2], response: 'in' },
    { lob_id: createdLobs[3].id, user_id: fakeIds[3], response: 'in' },
    { lob_id: createdLobs[4].id, user_id: fakeIds[1], response: 'in' },
    { lob_id: createdLobs[4].id, user_id: fakeIds[4], response: 'in' },
    { lob_id: createdLobs[4].id, user_id: fakeIds[5], response: 'in' },
    { lob_id: createdLobs[5].id, user_id: fakeIds[3], response: 'in' },
  ]);

  // Create demo trips
  const tripStart1 = new Date(now);
  tripStart1.setDate(tripStart1.getDate() + 14);
  const tripEnd1 = new Date(tripStart1);
  tripEnd1.setDate(tripEnd1.getDate() + 5);

  const tripStart2 = new Date(now);
  tripStart2.setDate(tripStart2.getDate() + 30);
  const tripEnd2 = new Date(tripStart2);
  tripEnd2.setDate(tripEnd2.getDate() + 7);

  const tripStart3 = new Date(now);
  tripStart3.setDate(tripStart3.getDate() + 60);
  const tripEnd3 = new Date(tripStart3);
  tripEnd3.setDate(tripEnd3.getDate() + 4);

  await supabase.from('trips').insert([
    {
      user_id: userId,
      city: 'London',
      country: 'UK',
      emoji: '🇬🇧',
      start_date: tripStart1.toISOString().split('T')[0],
      end_date: tripEnd1.toISOString().split('T')[0],
      show_on_profile: true,
    },
    {
      user_id: userId,
      city: 'Tokyo',
      country: 'Japan',
      emoji: '🇯🇵',
      start_date: tripStart2.toISOString().split('T')[0],
      end_date: tripEnd2.toISOString().split('T')[0],
      show_on_profile: true,
    },
    {
      user_id: userId,
      city: 'Barcelona',
      country: 'Spain',
      emoji: '🇪🇸',
      start_date: tripStart3.toISOString().split('T')[0],
      end_date: tripEnd3.toISOString().split('T')[0],
      show_on_profile: true,
    },
    // Fake member trips (for "Friends Visiting" section)
    {
      user_id: fakeIds[1], // Sam
      city: 'New York',
      country: 'USA',
      emoji: '🇺🇸',
      start_date: tripStart1.toISOString().split('T')[0],
      end_date: tripEnd1.toISOString().split('T')[0],
      show_on_profile: true,
    },
    {
      user_id: fakeIds[2], // Jordan
      city: 'New York',
      country: 'USA',
      emoji: '🗽',
      start_date: tripStart2.toISOString().split('T')[0],
      end_date: tripEnd2.toISOString().split('T')[0],
      show_on_profile: true,
    },
  ]);

  // Add a welcome notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'info',
    title: 'Welcome to Lob! 🎉',
    body: 'We created some demo plans to get you started. Try RSVPing!',
    emoji: '🏐',
    lob_id: createdLobs[0].id,
  });
}
