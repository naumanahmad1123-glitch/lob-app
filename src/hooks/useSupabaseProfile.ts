import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbProfile {
  id: string;
  name: string;
  avatar: string;
  avatar_photo_url: string | null;
  interests: string[];
  city: string | null;
  is_pro: boolean;
  created_at: string;
}

export function useSupabaseProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supabase-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) {
        // Profile might not exist yet, create it
        if (error.code === 'PGRST116') {
          const newProfile = {
            id: user!.id,
            name: user!.user_metadata?.name || user!.email?.split('@')[0] || 'User',
            avatar: '🙂',
            interests: [] as string[],
          };
          await supabase.from('profiles').insert(newProfile);
          return newProfile as DbProfile;
        }
        throw error;
      }
      return data as DbProfile;
    },
    staleTime: 30_000,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { name?: string; avatar?: string; interests?: string[]; city?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-profile'] });
    },
  });
}
