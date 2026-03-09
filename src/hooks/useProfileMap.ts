import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileInfo {
  id: string;
  name: string;
  avatar: string;
  interests: string[];
  city: string | null;
  is_pro: boolean;
}

/**
 * Fetches profiles for a list of user IDs from Supabase.
 * Returns a map of userId -> ProfileInfo.
 */
export function useProfileMap(userIds: string[]) {
  // Deduplicate and sort for stable query key
  const uniqueIds = [...new Set(userIds.filter(Boolean))].sort();

  return useQuery({
    queryKey: ['profile-map', uniqueIds],
    enabled: uniqueIds.length > 0,
    queryFn: async () => {
      const map: Record<string, ProfileInfo> = {};
      if (uniqueIds.length === 0) return map;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar, interests, city, is_pro')
        .in('id', uniqueIds);
      if (error) throw error;

      (data || []).forEach(p => {
        map[p.id] = {
          id: p.id,
          name: p.name || 'Unknown',
          avatar: p.avatar || '🙂',
          interests: p.interests || [],
          city: p.city,
          is_pro: p.is_pro,
        };
      });
      return map;
    },
    staleTime: 30_000,
  });
}

/** Helper to get a display name from profile map with fallback */
export function getProfileName(map: Record<string, ProfileInfo> | undefined, userId: string): string {
  return map?.[userId]?.name || 'Unknown';
}

/** Helper to get avatar from profile map with fallback */
export function getProfileAvatar(map: Record<string, ProfileInfo> | undefined, userId: string): string {
  return map?.[userId]?.avatar || '🙂';
}
