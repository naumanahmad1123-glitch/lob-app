import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lob, LobCategory, LobResponse, TimeOption, LobComment, LobStatus } from '@/data/types';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

function mapDbLob(row: any): Lob {
  return {
    id: row.id,
    title: row.title,
    category: (row.category || 'other') as LobCategory,
    groupId: row.group_id || '',
    groupName: row.group_name || '',
    createdBy: row.created_by,
    location: row.location || row.location_name || undefined,
    locationName: row.location_name || undefined,
    locationAddress: row.location_address || undefined,
    locationLat: row.location_lat ?? undefined,
    locationLng: row.location_lng ?? undefined,
    description: row.description || undefined,
    timeOptions: (row.lob_time_options || []).map((t: any) => ({
      id: t.id,
      datetime: t.datetime,
      votes: (t.lob_time_votes || []).map((v: any) => v.user_id),
    })) as TimeOption[],
    selectedTime: row.selected_time || undefined,
    quorum: row.quorum,
    capacity: row.capacity || undefined,
    deadline: row.deadline || undefined,
    recurrence: row.recurrence || undefined,
    whenMode: row.when_mode || undefined,
    flexibleWindow: row.flexible_window || undefined,
    status: (row.status || 'voting') as LobStatus,
    responses: (row.lob_responses || []).map((r: any) => ({
      userId: r.user_id,
      response: r.response,
      comment: r.comment || undefined,
    })) as LobResponse[],
    comments: (row.lob_comments || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      message: c.message,
      createdAt: c.created_at,
      suggestedTime: c.suggested_time || undefined,
    })) as LobComment[],
    createdAt: row.created_at,
    openInviteEnabled: row.open_invite_enabled,
    openInviteMaxGuests: row.open_invite_max_guests,
    openInviteUsedGuests: row.open_invite_used_guests,
    fillASeatActive: row.fill_a_seat_active,
    fillASeatSpots: row.fill_a_seat_spots,
    lastNudgedAt: row.last_nudged_at || undefined,
  };
}

export function useSupabaseLobs() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['supabase-lobs'],
    enabled: !!user,
    queryFn: async () => {
      // Fetch all lobs the user can see
      const { data, error } = await supabase
        .from('lobs')
        .select(`
          *,
          lob_time_options(*, lob_time_votes(*)),
          lob_responses(*),
          lob_comments(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch lob IDs where current user is a recipient
      const { data: recipientRows } = await supabase
        .from('lob_recipients')
        .select('lob_id')
        .eq('user_id', user!.id);
      const recipientLobIds = new Set((recipientRows || []).map(r => r.lob_id));

      // Fetch user's group IDs
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);
      const myGroupIds = new Set((memberRows || []).map(m => m.group_id));

      const allLobs = (data || []).map(mapDbLob);

      // Filter: show lobs where user is creator, in the group, or is a recipient
      return allLobs.filter(lob => {
        if (lob.createdBy === user!.id) return true;
        if (lob.groupId && myGroupIds.has(lob.groupId)) return true;
        if (recipientLobIds.has(lob.id)) return true;
        // Also show if user has already responded
        if (lob.responses.some(r => r.userId === user!.id)) return true;
        return false;
      });
    },
    staleTime: 10_000,
  });

  // Realtime subscription to refetch on changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('lobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobs' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lob_responses' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lob_recipients' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return query;
}

export function useSupabaseLob(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supabase-lob', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lobs')
        .select(`
          *,
          lob_time_options(*, lob_time_votes(*)),
          lob_responses(*),
          lob_comments(*)
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return mapDbLob(data);
    },
    staleTime: 5_000,
  });
}

/** Fetch recipient user IDs for a lob */
export function useLobRecipients(lobId: string | undefined) {
  return useQuery({
    queryKey: ['lob-recipients', lobId],
    enabled: !!lobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lob_recipients')
        .select('user_id')
        .eq('lob_id', lobId!);
      if (error) throw error;
      return (data || []).map(r => r.user_id);
    },
    staleTime: 30_000,
  });
}
