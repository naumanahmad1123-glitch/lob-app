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
  created_at: string;
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
      return (data || []) as DbTrip[];
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
