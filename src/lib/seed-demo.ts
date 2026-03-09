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

  // --- FAKE MEMBER PROFILES ---
  const fakeMembers = [
    { name: 'Jordan Lee', avatar: '🏄', interests: ['basketball', 'drinks', 'travel'], city: 'Toronto' },
    { name: 'Priya Sharma', avatar: '🎯', interests: ['padel', 'brunch', 'fitness'], city: 'Toronto' },
    { name: 'Marcus Chen', avatar: '💪', interests: ['basketball', 'padel', 'travel'], city: 'Toronto' },
    { name: 'Aisha Okafor', avatar: '🎨', interests: ['dinner', 'travel', 'culture'], city: 'London' },
    { name: 'Tyler Wu', avatar: '🤙', interests: ['basketball', 'drinks', 'coffee'], city: 'Toronto' },
    { name: 'Sofia Reyes', avatar: '✨', interests: ['padel', 'travel', 'rooftop'], city: 'Toronto' },
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

  // Index aliases
  const [jordanId, priyaId, marcusId, aishaId, tylerId, sofiaId] = fakeIds;

  // --- GROUPS ---
  const groups = [
    { name: 'Hoop Squad', emoji: '🏀', created_by: userId },
    { name: 'Casa Crew', emoji: '🏠', created_by: userId },
    { name: 'Padel Gang', emoji: '🎾', created_by: marcusId },
  ];

  const { data: createdGroups, error: gErr } = await supabase
    .from('groups')
    .insert(groups)
    .select();

  if (gErr || !createdGroups) return;

  const [hoopSquad, casaCrew, padelGang] = createdGroups;

  // --- GROUP MEMBERSHIPS ---
  const memberships = [
    // Hoop Squad: Nauman, Jordan, Marcus, Tyler, Priya, Aisha
    { group_id: hoopSquad.id, user_id: userId },
    { group_id: hoopSquad.id, user_id: jordanId },
    { group_id: hoopSquad.id, user_id: marcusId },
    { group_id: hoopSquad.id, user_id: tylerId },
    { group_id: hoopSquad.id, user_id: priyaId },
    { group_id: hoopSquad.id, user_id: aishaId },
    // Casa Crew: Nauman, Sofia, Jordan, Tyler, Aisha
    { group_id: casaCrew.id, user_id: userId },
    { group_id: casaCrew.id, user_id: sofiaId },
    { group_id: casaCrew.id, user_id: jordanId },
    { group_id: casaCrew.id, user_id: tylerId },
    { group_id: casaCrew.id, user_id: aishaId },
    // Padel Gang: Nauman, Marcus, Priya, Sofia
    { group_id: padelGang.id, user_id: userId },
    { group_id: padelGang.id, user_id: marcusId },
    { group_id: padelGang.id, user_id: priyaId },
    { group_id: padelGang.id, user_id: sofiaId },
  ];
  await supabase.from('group_members').insert(memberships);

  // --- LOBS ---
  const now = new Date();

  // Tomorrow 7pm
  const tomorrow7pm = new Date(now);
  tomorrow7pm.setDate(tomorrow7pm.getDate() + 1);
  tomorrow7pm.setHours(19, 0, 0, 0);

  // Tomorrow 3pm (deadline for lob 1)
  const tomorrow3pm = new Date(now);
  tomorrow3pm.setDate(tomorrow3pm.getDate() + 1);
  tomorrow3pm.setHours(15, 0, 0, 0);

  // Friday evening
  const friday = new Date(now);
  friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7 || 7));
  friday.setHours(20, 0, 0, 0);

  // Thursday 9pm (deadline for lob 2)
  const thursday9pm = new Date(now);
  thursday9pm.setDate(thursday9pm.getDate() + ((4 - thursday9pm.getDay() + 7) % 7 || 7));
  thursday9pm.setHours(21, 0, 0, 0);

  // Sunday 10am
  const sunday10am = new Date(now);
  sunday10am.setDate(sunday10am.getDate() + ((7 - sunday10am.getDay()) % 7 || 7));
  sunday10am.setHours(10, 0, 0, 0);

  // Saturday 6pm (deadline for lob 3)
  const saturday6pm = new Date(now);
  saturday6pm.setDate(saturday6pm.getDate() + ((6 - saturday6pm.getDay() + 7) % 7 || 7));
  saturday6pm.setHours(18, 0, 0, 0);

  // Past dates
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const threeWeeksAgo = new Date(now);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  const lobs = [
    // 1. Pickup basketball — CONFIRMED
    {
      title: 'Pickup basketball tmrw 7pm',
      category: 'sports',
      group_id: hoopSquad.id,
      group_name: 'Hoop Squad',
      created_by: userId,
      location: 'Regent Park Courts',
      quorum: 4,
      deadline: tomorrow3pm.toISOString(),
      status: 'confirmed',
    },
    // 2. Rooftop drinks — VOTING (pending)
    {
      title: 'Rooftop drinks Friday?',
      category: 'chill',
      group_id: casaCrew.id,
      group_name: 'Casa Crew',
      created_by: sofiaId,
      location: 'Bar Raval, Toronto',
      quorum: 3,
      deadline: thursday9pm.toISOString(),
      status: 'voting',
    },
    // 3. Padel Sunday — VOTING (pending)
    {
      title: 'Padel Sunday morning',
      category: 'padel',
      group_id: padelGang.id,
      group_name: 'Padel Gang',
      created_by: marcusId,
      location: 'Toronto Padel Club',
      quorum: 4,
      deadline: saturday6pm.toISOString(),
      status: 'voting',
    },
    // 4. Raptors watch party — past confirmed
    {
      title: 'Raptors watch party',
      category: 'chill',
      group_id: casaCrew.id,
      group_name: 'Casa Crew',
      created_by: userId,
      location: 'Real Sports Bar',
      quorum: 3,
      status: 'completed',
      created_at: twoWeeksAgo.toISOString(),
    },
    // 5. Brunch Saturday — past cancelled
    {
      title: 'Brunch Saturday',
      category: 'dinner',
      group_id: casaCrew.id,
      group_name: 'Casa Crew',
      created_by: jordanId,
      location: 'Lady Marmalade',
      quorum: 4,
      status: 'cancelled',
      created_at: oneWeekAgo.toISOString(),
    },
    // 6. Track night — past confirmed
    {
      title: 'Track night',
      category: 'sports',
      group_id: hoopSquad.id,
      group_name: 'Hoop Squad',
      created_by: tylerId,
      location: 'U of T Track',
      quorum: 3,
      status: 'completed',
      created_at: threeWeeksAgo.toISOString(),
    },
  ];

  const { data: createdLobs, error: lErr } = await supabase
    .from('lobs')
    .insert(lobs)
    .select();

  if (lErr || !createdLobs) return;

  // --- TIME OPTIONS ---
  const timeOptions = [
    { lob_id: createdLobs[0].id, datetime: tomorrow7pm.toISOString() },
    { lob_id: createdLobs[1].id, datetime: friday.toISOString() },
    { lob_id: createdLobs[2].id, datetime: sunday10am.toISOString() },
    { lob_id: createdLobs[3].id, datetime: twoWeeksAgo.toISOString() },
    { lob_id: createdLobs[5].id, datetime: threeWeeksAgo.toISOString() },
  ];
  await supabase.from('lob_time_options').insert(timeOptions);

  // --- RSVP RESPONSES ---
  const responses = [
    // Lob 1: Pickup basketball — Marcus ✅, Jordan ✅, Tyler ✅, Aisha ❌, Nauman ✅ (creator)
    { lob_id: createdLobs[0].id, user_id: userId, response: 'in' },
    { lob_id: createdLobs[0].id, user_id: marcusId, response: 'in' },
    { lob_id: createdLobs[0].id, user_id: jordanId, response: 'in' },
    { lob_id: createdLobs[0].id, user_id: tylerId, response: 'in' },
    { lob_id: createdLobs[0].id, user_id: aishaId, response: 'out' },

    // Lob 2: Rooftop drinks — Nauman ✅, Jordan ✅, Tyler maybe
    { lob_id: createdLobs[1].id, user_id: userId, response: 'in' },
    { lob_id: createdLobs[1].id, user_id: jordanId, response: 'in' },
    { lob_id: createdLobs[1].id, user_id: tylerId, response: 'maybe' },

    // Lob 3: Padel Sunday — Marcus ✅, Sofia ✅
    { lob_id: createdLobs[2].id, user_id: marcusId, response: 'in' },
    { lob_id: createdLobs[2].id, user_id: sofiaId, response: 'in' },

    // Lob 4: Raptors watch party — all in (past)
    { lob_id: createdLobs[3].id, user_id: userId, response: 'in' },
    { lob_id: createdLobs[3].id, user_id: sofiaId, response: 'in' },
    { lob_id: createdLobs[3].id, user_id: jordanId, response: 'in' },
    { lob_id: createdLobs[3].id, user_id: tylerId, response: 'in' },
    { lob_id: createdLobs[3].id, user_id: aishaId, response: 'in' },

    // Lob 5: Brunch — only 2/4 (cancelled)
    { lob_id: createdLobs[4].id, user_id: jordanId, response: 'in' },
    { lob_id: createdLobs[4].id, user_id: userId, response: 'in' },

    // Lob 6: Track night — 4 attended (past)
    { lob_id: createdLobs[5].id, user_id: tylerId, response: 'in' },
    { lob_id: createdLobs[5].id, user_id: userId, response: 'in' },
    { lob_id: createdLobs[5].id, user_id: marcusId, response: 'in' },
    { lob_id: createdLobs[5].id, user_id: jordanId, response: 'in' },
  ];
  await supabase.from('lob_responses').insert(responses);

  // --- LOB COMMENTS ---
  const comments = [
    // Lob 1: Pickup basketball
    { lob_id: createdLobs[0].id, user_id: marcusId, message: "I'll bring the ball 🏀" },
    { lob_id: createdLobs[0].id, user_id: jordanId, message: 'Court 2 or 3?' },
    // Lob 2: Rooftop drinks
    { lob_id: createdLobs[1].id, user_id: userId, message: "I'm so in" },
  ];
  await supabase.from('lob_comments').insert(comments);

  // --- TRIPS ---
  // Nauman's trips
  const may16 = '2026-05-16';
  const may19 = '2026-05-19';
  const springStart = '2026-04-01';
  const springEnd = '2026-05-31';
  const summerStart = '2026-07-01';
  const summerEnd = '2026-08-31';

  // Aisha visiting Toronto
  const aishaMay3 = '2026-05-03';
  const aishaMay7 = '2026-05-07';

  await supabase.from('trips').insert([
    // 1. Mexico City — dates open
    {
      user_id: userId,
      city: 'Mexico City',
      country: 'Mexico',
      emoji: '🇲🇽',
      start_date: springStart,
      end_date: springEnd,
      show_on_profile: true,
    },
    // 2. Montréal Long Weekend — confirmed
    {
      user_id: userId,
      city: 'Montréal',
      country: 'Canada',
      emoji: '🇨🇦',
      start_date: may16,
      end_date: may19,
      show_on_profile: true,
    },
    // 3. Somewhere this summer — fully open
    {
      user_id: userId,
      city: 'TBD',
      country: 'TBD',
      emoji: '🌍',
      start_date: summerStart,
      end_date: summerEnd,
      show_on_profile: true,
    },
    // Aisha visiting Toronto
    {
      user_id: aishaId,
      city: 'Toronto',
      country: 'Canada',
      emoji: '🇨🇦',
      start_date: aishaMay3,
      end_date: aishaMay7,
      show_on_profile: true,
    },
  ]);

  // --- NOTIFICATIONS ---
  await supabase.from('notifications').insert([
    {
      user_id: userId,
      type: 'info',
      title: 'Hoop Squad lob confirmed!',
      body: "See you at Regent Park tmrw 🏀",
      emoji: '🏀',
      lob_id: createdLobs[0].id,
    },
    {
      user_id: userId,
      type: 'response',
      title: 'Tyler voted maybe on Rooftop drinks',
      body: 'Rooftop drinks Friday?',
      emoji: '🤙',
      lob_id: createdLobs[1].id,
    },
    {
      user_id: userId,
      type: 'info',
      title: 'Sofia started a new trip: Mexico City',
      body: 'Want in?',
      emoji: '✨',
    },
  ]);
}
