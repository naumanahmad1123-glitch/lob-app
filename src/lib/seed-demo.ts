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

  // Add user as member of each group
  const memberships = createdGroups.map(g => ({
    group_id: g.id,
    user_id: userId,
  }));
  await supabase.from('group_members').insert(memberships);

  // Create demo lobs
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
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
  await supabase.from('lob_time_options').insert(timeOptions);

  // RSVP the user as "in" for the first lob
  await supabase.from('lob_responses').insert({
    lob_id: createdLobs[0].id,
    user_id: userId,
    response: 'in',
  });

  // Create a demo trip
  const tripStart = new Date(now);
  tripStart.setDate(tripStart.getDate() + 14);
  const tripEnd = new Date(tripStart);
  tripEnd.setDate(tripEnd.getDate() + 5);

  await supabase.from('trips').insert({
    user_id: userId,
    city: 'London',
    country: 'UK',
    emoji: '🇬🇧',
    start_date: tripStart.toISOString().split('T')[0],
    end_date: tripEnd.toISOString().split('T')[0],
    show_on_profile: true,
  });

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
