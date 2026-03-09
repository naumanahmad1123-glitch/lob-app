import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface DbTrip {
  id: string;
  user_id: string;
  city: string;
  country: string;
  emoji: string;
  start_date: string;
  end_date: string;
  notify_user_ids: string[];
  show_on_profile: boolean;
  status: string;
  created_at: string;
  userName?: string;
  userAvatar?: string;
}

export function useSupabaseTrips() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['supabase-trips'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      const trips = (data || []) as DbTrip[];

      // Fetch profile names for non-current-user trips
      const otherUserIds = [...new Set(trips.filter(t => t.user_id !== user?.id).map(t => t.user_id))];
      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', otherUserIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        trips.forEach(t => {
          const p = profileMap.get(t.user_id);
          if (p) {
            t.userName = p.name;
            t.userAvatar = p.avatar;
          }
        });
      }

      return trips;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('trips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return query;
}
