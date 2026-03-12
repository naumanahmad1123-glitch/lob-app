import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronDown, UserPlus, Users, Sparkles, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

type TabKey = 'connections' | 'groups';

const Connect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allGroups = [], isLoading: groupsLoading } = useSupabaseGroups();
  const [activeTab, setActiveTab] = useState<TabKey>('connections');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name, avatar');
      return data || [];
    },
    staleTime: 30_000,
  });

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
            user_id: m.user_id, name: m.name, avatar: m.avatar,
            groupCount: 1, sharedGroupNames: [g.name],
          });
        }
      });
    });
    return Array.from(friendMap.values()).sort((a, b) => b.groupCount - a.groupCount);
  }, [allGroups, user]);

  const friendIds = useMemo(() => new Set(friends.map(f => f.user_id)), [friends]);

  const suggestions = useMemo(() => {
    if (!user) return [];
    return allProfiles.filter(p => p.id !== user.id && !friendIds.has(p.id)).slice(0, 6);
  }, [allProfiles, user, friendIds]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(f => f.name.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return suggestions;
    const q = searchQuery.toLowerCase();
    return allProfiles.filter(p => p.id !== user?.id && !friendIds.has(p.id) && p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [suggestions, searchQuery, allProfiles, user, friendIds]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allGroups;
    const q = searchQuery.toLowerCase();
    return allGroups.filter(g => g.name.toLowerCase().includes(q));
  }, [allGroups, searchQuery]);

  const getShowRate = (userId: string) => {
    const code = userId.charCodeAt(0) + userId.charCodeAt(1) + userId.charCodeAt(2);
    return 65 + (code % 31);
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-2">
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Connect</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your people & groups</p>
          </div>
          {activeTab === 'groups' && (
            <button
              onClick={() => navigate('/create-group')}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5 text-foreground" />
            </button>
          )}
          {activeTab === 'connections' && (
            <button
              onClick={() => setSearchQuery(prev => prev ? '' : ' ')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/60 mb-2">
          {([
            { key: 'connections' as TabKey, label: 'Connections', count: friends.length },
            { key: 'groups' as TabKey, label: 'Groups', count: allGroups.length },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === 'connections' ? 'Search people...' : 'Search groups...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {groupsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'connections' ? (
              <motion.div
                key="connections"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <Collapsible defaultOpen className="mb-4">
                  <CollapsibleTrigger className="flex items-center gap-2 mb-2 w-full cursor-pointer group">
                    <Users className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Your Connections</h2>
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform group-data-[state=closed]:-rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
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
                              <p className="text-xs text-muted-foreground truncate">{friend.sharedGroupNames.join(', ')}</p>
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
                        {searchQuery.trim() ? 'No connections match your search' : 'No connections yet'}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Join groups to connect with people</p>
                    </div>
                  )}
                  </CollapsibleContent>
                </Collapsible>

                {filteredSuggestions.length > 0 && (
                  <Collapsible defaultOpen className="mb-4">
                    <CollapsibleTrigger className="flex items-center gap-2 mb-2 w-full cursor-pointer group">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-bold text-foreground">People You May Know</h2>
                      <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform group-data-[state=closed]:-rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
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
                              onClick={e => { e.stopPropagation(); navigate(`/user/${person.id}`); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> View
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Collapsible defaultOpen className="mb-4">
                  <CollapsibleTrigger className="flex items-center gap-2 mb-2 w-full cursor-pointer group">
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground">Requests</h2>
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform group-data-[state=closed]:-rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                  <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                    <UserPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Incoming requests will appear here</p>
                  </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ) : (
              <motion.div
                key="groups"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <section className="mb-4">
                  {filteredGroups.length === 0 ? (
                    <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
                      <span className="text-4xl mb-3 block">👥</span>
                      <p className="text-sm font-semibold text-foreground">
                        {searchQuery.trim() ? 'No groups match your search' : 'No groups yet'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Create a group to start making plans!</p>
                      <button
                        onClick={() => navigate('/create-group')}
                        className="mt-4 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
                      >
                        Create Group
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredGroups.map((group, i) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="gradient-card rounded-2xl p-3 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                                {group.emoji}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground text-[15px]">{group.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{group.members.length} members</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-1 mt-3">
                            {group.members.slice(0, 5).map((m) => (
                              <span key={m.id} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">
                                {m.avatar}
                              </span>
                            ))}
                            {group.members.length > 5 && (
                              <span className="text-xs text-muted-foreground ml-1">+{group.members.length - 5}</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
};

export default Connect;
