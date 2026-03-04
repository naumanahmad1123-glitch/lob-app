import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Copy, Share2, X, Search, Phone, Link2, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { users, currentUser } from '@/data/seed';
import { User } from '@/data/types';
import { groupStore } from '@/stores/groupStore';
import { toast } from '@/hooks/use-toast';

const EMOJI_CATEGORIES: Record<string, string[]> = {
  Sports: ['🏀', '⚽', '🎾', '🏋️', '🏊', '⛷️', '🚴', '🏈', '🏓', '🥊'],
  Food: ['🍕', '🍷', '🍽️', '☕', '🍺', '🥞', '🍣', '🌮', '🍔', '🧁'],
  Social: ['🎉', '🎤', '🎬', '🎮', '🎲', '🪩', '🍿', '💃', '🎸', '🎨'],
  Travel: ['✈️', '🏖️', '⛺', '🚗', '🏔️', '🗺️', '🌍', '🛳️', '🚂', '🏕️'],
  Vibes: ['😎', '🔥', '💎', '🌙', '⚡', '🦋', '🌈', '✨', '💫', '🌊'],
};

const NAME_EMOJI_MAP: Record<string, string> = {
  hoop: '🏀', basket: '🏀', soccer: '⚽', football: '🏈', tennis: '🎾', padel: '🎾',
  gym: '🏋️', swim: '🏊', ski: '⛷️', bike: '🚴', run: '🏃', yoga: '🧘',
  dinner: '🍽️', lunch: '🍽️', brunch: '🥞', pizza: '🍕', sushi: '🍣', taco: '🌮',
  coffee: '☕', wine: '🍷', beer: '🍺', burger: '🍔', food: '🍕',
  party: '🎉', music: '🎤', movie: '🎬', game: '🎮', karaoke: '🎤',
  travel: '✈️', beach: '🏖️', camp: '⛺', hike: '🏔️', road: '🚗',
  chill: '😎', night: '🌙', dance: '💃', art: '🎨', book: '📚',
  squad: '👊', crew: '🤝', club: '🏛️', gang: '💪', team: '🏆',
};

function autoSuggestEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, emoji] of Object.entries(NAME_EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji;
  }
  return '🎯';
}

export default function CreateGroup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [customEmojiMode, setCustomEmojiMode] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const displayEmoji = customEmojiMode ? customEmoji : selectedEmoji;
  const progressValue = ((step + 1) / 3) * 100;

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return users
      .filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(q))
      .filter(u => !members.some(m => m.id === u.id));
  }, [searchQuery, members]);

  const addMember = (user: User) => {
    setMembers(prev => [...prev, user]);
    setSearchQuery('');
  };

  const removeMember = (userId: string) => {
    setMembers(prev => prev.filter(m => m.id !== userId));
  };

  const addByPhone = () => {
    if (!phoneNumber.trim()) return;
    const fakeUser: User = {
      id: `phone-${Date.now()}`,
      name: phoneNumber,
      avatar: '📱',
      interests: [],
    };
    setMembers(prev => [...prev, fakeUser]);
    setPhoneNumber('');
  };

  const inviteLink = `https://lob.app/join/${groupName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: `Join ${groupName} on Lob!`, url: inviteLink });
    } else {
      copyLink();
    }
  };

  const handleCreate = () => {
    const newGroup = {
      id: `g-${Date.now()}`,
      name: groupName,
      emoji: displayEmoji || '🎯',
      members: [currentUser, ...members],
      lastActivity: 'Just now',
      unreadCount: 0,
    };
    groupStore.addGroup(newGroup);
    toast({
      title: 'Group created! Lob something 🎉',
    });
    navigate(`/groups/${newGroup.id}`);
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : navigate('/groups'))}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {step === 0 ? 'Name & Identity' : step === 1 ? 'Add People' : 'Confirm'}
          </h1>
        </div>

        {/* Progress */}
        <Progress value={progressValue} className="h-1.5 mb-6 bg-secondary" />

        <AnimatePresence mode="wait">
          {/* ── STEP 0: Name & Identity ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-5"
            >
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-4xl shrink-0">
                  {displayEmoji || '❓'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Group preview</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {groupName || 'Group name…'}
                  </p>
                </div>
              </div>

              {/* Name input */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Group Name</label>
                <Input
                  placeholder="e.g. Hoop Squad"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="h-12 text-base bg-secondary border-border/50"
                  autoFocus
                />
              </div>

              {/* Auto-suggest */}
              <button
                onClick={() => {
                  setCustomEmojiMode(false);
                  setSelectedEmoji(autoSuggestEmoji(groupName));
                }}
                className="flex items-center gap-2 text-sm font-medium text-primary active:scale-95 transition-transform"
              >
                <Sparkles className="w-4 h-4" /> Auto-suggest emoji
              </button>

              {/* Emoji grid */}
              <div className="space-y-4">
                {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {emojis.map(e => (
                        <button
                          key={e}
                          onClick={() => { setSelectedEmoji(e); setCustomEmojiMode(false); }}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all
                            ${selectedEmoji === e && !customEmojiMode
                              ? 'bg-primary/20 ring-2 ring-primary scale-110'
                              : 'bg-secondary hover:bg-secondary/80 active:scale-95'
                            }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom emoji */}
              <div>
                <button
                  onClick={() => setCustomEmojiMode(true)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✏️ Type your own
                </button>
                {customEmojiMode && (
                  <Input
                    placeholder="Paste an emoji"
                    value={customEmoji}
                    onChange={e => setCustomEmoji(e.target.value.slice(0, 2))}
                    className="mt-2 h-12 text-2xl text-center bg-secondary border-border/50 w-24"
                    autoFocus
                  />
                )}
              </div>

              {/* Next */}
              <Button
                onClick={() => setStep(1)}
                disabled={!groupName.trim()}
                className="w-full h-12 text-base font-semibold rounded-xl gradient-primary"
              >
                Next
              </Button>
            </motion.div>
          )}

          {/* ── STEP 1: Add People ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-5"
            >
              {/* Member chips */}
              {members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {members.length} member{members.length !== 1 ? 's' : ''} added
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => (
                      <button
                        key={m.id}
                        onClick={() => removeMember(m.id)}
                        className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-secondary border border-border/50 text-sm group active:scale-95 transition-transform"
                      >
                        <span className="text-base">{m.avatar}</span>
                        <span className="text-foreground font-medium max-w-[100px] truncate">{m.name}</span>
                        <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Tabs defaultValue="username" className="w-full">
                <TabsList className="w-full bg-secondary rounded-xl h-10">
                  <TabsTrigger value="username" className="flex-1 rounded-lg text-xs gap-1 data-[state=active]:bg-card">
                    <Search className="w-3.5 h-3.5" /> Username
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex-1 rounded-lg text-xs gap-1 data-[state=active]:bg-card">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 rounded-lg text-xs gap-1 data-[state=active]:bg-card">
                    <Link2 className="w-3.5 h-3.5" /> Link
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="username" className="mt-4 space-y-2">
                  <Input
                    placeholder="Search users…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-11 bg-secondary border-border/50"
                  />
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => addMember(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform"
                    >
                      <span className="text-xl">{u.avatar}</span>
                      <span className="font-medium text-foreground text-sm">{u.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{u.city}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="phone" className="mt-4 space-y-3">
                  <Input
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="h-11 bg-secondary border-border/50"
                    type="tel"
                  />
                  <Button
                    onClick={addByPhone}
                    disabled={!phoneNumber.trim()}
                    className="w-full h-10 rounded-xl"
                    variant="secondary"
                  >
                    Send SMS Invite
                  </Button>
                </TabsContent>

                <TabsContent value="link" className="mt-4 space-y-3">
                  <div className="p-3 rounded-xl bg-card border border-border/50 text-xs text-muted-foreground break-all font-mono">
                    {inviteLink}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copyLink} variant="secondary" className="flex-1 h-10 rounded-xl gap-2">
                      <Copy className="w-4 h-4" /> {linkCopied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button onClick={shareLink} className="flex-1 h-10 rounded-xl gap-2 gradient-primary">
                      <Share2 className="w-4 h-4" /> Share
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep(2)}
                  variant="ghost"
                  className="flex-1 h-12 text-muted-foreground rounded-xl"
                >
                  Do this later
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 rounded-xl gradient-primary font-semibold"
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-6"
            >
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-5xl">
                  {displayEmoji || '🎯'}
                </div>
                <h2 className="text-xl font-bold text-foreground">{groupName}</h2>

                {/* Members */}
                <div className="flex flex-wrap justify-center gap-2">
                  {/* Creator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-sm">
                    <span>{currentUser.avatar}</span>
                    <span className="text-foreground font-medium">You</span>
                  </div>
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-sm">
                      <span>{m.avatar}</span>
                      <span className="text-foreground font-medium max-w-[80px] truncate">{m.name}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  <Users className="w-4 h-4 inline mr-1" />
                  {members.length + 1} member{members.length > 0 ? 's' : ''}
                </p>
              </div>

              <Button
                onClick={handleCreate}
                className="w-full h-13 text-base font-semibold rounded-xl gradient-primary"
              >
                Create Group
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
