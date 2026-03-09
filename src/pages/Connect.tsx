import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, UserPlus, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FriendInfo {
  user_id: string;
  name: string;
  avatar: string;
  groupCount: number;
  sharedGroupNames: string[];
}

const Connect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allGroups = [], isLoading: groupsLoading } = useSupabaseGroups();
  const [searchQuery, setSearchQuery] = useState('');

  // All profiles for search
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name, avatar');
      return data || [];
    },
    staleTime: 30_000,
  });

  // Derive connections from shared groups
  const friends = useMemo<FriendInfo[]>(() => {
    if (!user) return [];
    const friendMap = new Map<string, FriendInfo>();
    allGroups.forEach(g => {
      const iAmMember = g.members.some(m => m.user_id === user.id);
      if (!iAmMember) return;
      g.members.forEach(m => {
        if (m.user_id === user.id) return;
        const existing = friendMap.get(m.user_id);
        if (existing) {
          existing.groupCount++;
          existing.sharedGroupNames.push(g.name);
        } else {
          friendMap.set(m.user_id, {
            user_id: m.user_id,
            name: m.name,
            avatar: m.avatar,
            groupCount: 1,
            sharedGroupNames: [g.name],
          });
        }
      });
    });
    return Array.from(friendMap.values()).sort((a, b) => b.groupCount - a.groupCount);
  }, [allGroups, user]);

  const friendIds = useMemo(() => new Set(friends.map(f => f.user_id)), [friends]);

  // People You May Know — profiles not in your groups (excluding self)
  const suggestions = useMemo(() => {
    if (!user) return [];
    return allProfiles
      .filter(p => p.id !== user.id && !friendIds.has(p.id))
      .slice(0, 6);
  }, [allProfiles, user, friendIds]);

  // Search filtering
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(f => f.name.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return suggestions;
    const q = searchQuery.toLowerCase();
    return allProfiles
      .filter(p => p.id !== user?.id && !friendIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [suggestions, searchQuery, allProfiles, user, friendIds]);

  const isLoading = groupsLoading;

  // Deterministic show rate from user_id
  const getShowRate = (userId: string) => {
    const code = userId.charCodeAt(0) + userId.charCodeAt(1) + userId.charCodeAt(2);
    return 65 + (code % 31); // 65-95%
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="pt-12 pb-4">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Connect</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your people & connections</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Loading connections...</p>
          </div>
        ) : (
          <>
            {/* Your Connections */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Your Connections</h2>
                <span className="text-xs text-muted-foreground ml-auto">{friends.length}</span>
              </div>
              {filteredFriends.length > 0 ? (
                <div className="space-y-2">
                  {filteredFriends.map((friend, i) => (
                    <motion.div
                      key={friend.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/user/${friend.user_id}`)}
                      className="gradient-card rounded-2xl px-4 py-3 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          {friend.avatar}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-[15px] truncate">{friend.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {friend.sharedGroupNames.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                            {getShowRate(friend.user_id)}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                  <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No connections match your search' : 'No connections yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Join groups to connect with people</p>
                </div>
              )}
            </section>

            {/* People You May Know */}
            {filteredSuggestions.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">People You May Know</h2>
                </div>
                <div className="space-y-2">
                  {filteredSuggestions.map((person, i) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/user/${person.id}`)}
                      className="gradient-card rounded-2xl px-4 py-3 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          {person.avatar}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-[15px] truncate">{person.name}</h3>
                          <p className="text-xs text-muted-foreground">Suggested for you</p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/user/${person.id}`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold active:scale-95 transition-transform"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Requests (placeholder for future) */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-bold text-foreground">Requests</h2>
              </div>
              <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                <UserPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Incoming requests will appear here</p>
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Connect;
