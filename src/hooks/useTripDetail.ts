import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface TripMember {
  id: string;
  user_id: string;
  status: string;
  name: string;
  avatar: string;
  avatar_photo_url: string | null;
}

export interface TripSuggestion {
  id: string;
  trip_id: string;
  user_id: string;
  type: string; // 'destination' | 'date' | 'activity'
  content: string;
  extra: Record<string, any>;
  created_at: string;
  userName: string;
  userAvatar: string;
  userPhotoUrl: string | null;
  votes: string[]; // user_ids who voted
}

export interface TripComment {
  id: string;
  trip_id: string;
  user_id: string;
  message: string;
  created_at: string;
  userName: string;
  userAvatar: string;
  userPhotoUrl: string | null;
}

export function useTripMembers(tripId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trip-members', tripId],
    enabled: !!tripId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId!);
      if (error) throw error;

      const userIds = [...new Set((data || []).map(m => m.user_id))];
      const profileMap: Record<string, { name: string; avatar: string; avatar_photo_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar, avatar_photo_url')
          .in('id', userIds);
        (profiles || []).forEach(p => {
          profileMap[p.id] = { name: p.name || 'Unknown', avatar: p.avatar || '🙂', avatar_photo_url: p.avatar_photo_url || null };
        });
      }

      return (data || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        status: m.status,
        name: profileMap[m.user_id]?.name || 'Unknown',
        avatar: profileMap[m.user_id]?.avatar || '🙂',
        avatar_photo_url: profileMap[m.user_id]?.avatar_photo_url || null,
      })) as TripMember[];
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!tripId || !user) return;
    const channel = supabase
      .channel(`trip-members-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, user]);

  return query;
}

export function useTripSuggestions(tripId: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['trip-suggestions', tripId],
    enabled: !!tripId && !!user,
    queryFn: async () => {
      const { data: suggestions, error } = await supabase
        .from('trip_suggestions')
        .select('*')
        .eq('trip_id', tripId!)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const suggestionIds = (suggestions || []).map(s => s.id);
      let votesMap: Record<string, string[]> = {};
      if (suggestionIds.length > 0) {
        const { data: votes } = await supabase
          .from('trip_votes')
          .select('*')
          .in('suggestion_id', suggestionIds);
        (votes || []).forEach(v => {
          if (!votesMap[v.suggestion_id]) votesMap[v.suggestion_id] = [];
          votesMap[v.suggestion_id].push(v.user_id);
        });
      }

      const userIds = [...new Set((suggestions || []).map(s => s.user_id))];
      const profileMap: Record<string, { name: string; avatar: string; avatar_photo_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar, avatar_photo_url')
          .in('id', userIds);
        (profiles || []).forEach(p => {
          profileMap[p.id] = { name: p.name || 'Unknown', avatar: p.avatar || '🙂', avatar_photo_url: p.avatar_photo_url || null };
        });
      }

      return (suggestions || []).map(s => ({
        id: s.id,
        trip_id: s.trip_id,
        user_id: s.user_id,
        type: s.type,
        content: s.content,
        extra: (s.extra as Record<string, any>) || {},
        created_at: s.created_at,
        userName: profileMap[s.user_id]?.name || 'Unknown',
        userAvatar: profileMap[s.user_id]?.avatar || '🙂',
        userPhotoUrl: profileMap[s.user_id]?.avatar_photo_url || null,
        votes: votesMap[s.id] || [],
      })) as TripSuggestion[];
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!tripId || !user) return;
    const channel = supabase
      .channel(`trip-suggestions-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_suggestions', filter: `trip_id=eq.${tripId}` }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_votes' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, user]);

  return query;
}

export function useTripComments(tripId: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['trip-comments', tripId],
    enabled: !!tripId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_comments')
        .select('*')
        .eq('trip_id', tripId!)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const profileMap: Record<string, { name: string; avatar: string; avatar_photo_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar, avatar_photo_url')
          .in('id', userIds);
        (profiles || []).forEach(p => {
          profileMap[p.id] = { name: p.name || 'Unknown', avatar: p.avatar || '🙂', avatar_photo_url: p.avatar_photo_url || null };
        });
      }

      return (data || []).map(c => ({
        id: c.id,
        trip_id: c.trip_id,
        user_id: c.user_id,
        message: c.message,
        created_at: c.created_at,
        userName: profileMap[c.user_id]?.name || 'Unknown',
        userAvatar: profileMap[c.user_id]?.avatar || '🙂',
        userPhotoUrl: profileMap[c.user_id]?.avatar_photo_url || null,
      })) as TripComment[];
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!tripId || !user) return;
    const channel = supabase
      .channel(`trip-comments-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_comments', filter: `trip_id=eq.${tripId}` }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, user]);

  return query;
}
