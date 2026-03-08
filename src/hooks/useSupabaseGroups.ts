import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface DbGroup {
  id: string;
  name: string;
  emoji: string;
  created_by: string | null;
  created_at: string;
  members: { id: string; user_id: string; name: string; avatar: string }[];
}

export function useSupabaseGroups() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['supabase-groups'],
    enabled: !!user,
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`*, group_members(*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for all member user_ids
      const allUserIds = new Set<string>();
      (groups || []).forEach((g: any) => {
        (g.group_members || []).forEach((m: any) => allUserIds.add(m.user_id));
      });

      let profileMap: Record<string, { name: string; avatar: string }> = {};
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', Array.from(allUserIds));
        (profiles || []).forEach(p => {
          profileMap[p.id] = { name: p.name, avatar: p.avatar };
        });
      }

      return (groups || []).map((g: any): DbGroup => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        created_by: g.created_by,
        created_at: g.created_at,
        members: (g.group_members || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          name: profileMap[m.user_id]?.name || 'Unknown',
          avatar: profileMap[m.user_id]?.avatar || '🙂',
        })),
      }));
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('groups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return query;
}
