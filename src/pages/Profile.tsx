import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, Bell, Calendar, Shield, LogOut, Users, HelpCircle, X, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseProfile, useUpdateProfile } from '@/hooks/useSupabaseProfile';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { ShowRateBadge } from '@/components/lob/ShowRateBadge';
import { toast } from 'sonner';

const AVATAR_OPTIONS = ['🙂', '😎', '🤙', '🏄', '🎯', '🎤', '🚀', '🎨', '🦊', '🐻', '🌟', '⚡', '🔥', '🎸', '🧠', '👾'];

const INTEREST_OPTIONS = [
  { key: 'sports', label: '🏀 Sports' },
  { key: 'dinner', label: '🍽️ Dinner' },
  { key: 'coffee', label: '☕ Coffee' },
  { key: 'gym', label: '💪 Gym' },
  { key: 'chill', label: '😎 Chill' },
  { key: 'travel', label: '✈️ Travel' },
  { key: 'padel', label: '🎾 Padel' },
  { key: 'music', label: '🎵 Music' },
  { key: 'gaming', label: '🎮 Gaming' },
  { key: 'art', label: '🎨 Art' },
  { key: 'hiking', label: '🥾 Hiking' },
  { key: 'cooking', label: '🧑‍🍳 Cooking' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useSupabaseProfile();
  const { data: allLobs = [] } = useSupabaseLobs();
  const { data: allGroups = [] } = useSupabaseGroups();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();

  const [showRateTooltip, setShowRateTooltip] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);

  const totalPlans = allLobs.filter(l => l.createdBy === user?.id).length;
  const totalGroups = allGroups.length;

  const openEditSheet = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setEditInterests([...profile.interests]);
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: editName.trim(),
        avatar: editAvatar,
        interests: editInterests,
      });
      toast.success('Profile updated!');
      setEditingProfile(false);
    } catch {
      toast.error('Failed to save profile');
    }
  };

  const toggleInterest = (key: string) => {
    setEditInterests(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/auth');
  };

  if (isLoading || !profile) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Profile</h1>
          <button onClick={() => { setShowComingSoon('Settings'); setTimeout(() => setShowComingSoon(null), 2000); }} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <AnimatePresence>
          {showComingSoon && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-card border border-border shadow-card">
              <p className="text-sm font-medium text-foreground">{showComingSoon} — coming soon ✨</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Profile Sheet */}
        <AnimatePresence>
          {editingProfile && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProfile(false)} className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto">
                <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-4 max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-foreground">✏️ Edit Profile</h2>
                    <button onClick={() => setEditingProfile(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Avatar</label>
                    <div className="grid grid-cols-8 gap-2">
                      {AVATAR_OPTIONS.map(emoji => (
                        <button key={emoji} onClick={() => setEditAvatar(emoji)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${editAvatar === emoji ? 'bg-primary/15 border-2 border-primary scale-110' : 'bg-secondary border border-border hover:bg-muted'}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map(opt => {
                        const active = editInterests.includes(opt.key);
                        return (
                          <button key={opt.key} onClick={() => toggleInterest(opt.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="gradient-card rounded-2xl p-6 border border-border/50 shadow-card mb-6 text-center relative">
          <button onClick={openEditSheet} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto flex items-center justify-center text-4xl mb-3">{profile.avatar}</div>
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Making plans since 2026</p>

          <div className="flex justify-center gap-8 mt-5">
            <div>
              <p className="text-xl font-bold text-foreground">{totalPlans}</p>
              <p className="text-[11px] text-muted-foreground">Plans Made</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalGroups}</p>
              <p className="text-[11px] text-muted-foreground">Groups</p>
            </div>
            <div className="relative">
              <ShowRateBadge total={12} showed={11} />
              <button onClick={() => setShowRateTooltip(!showRateTooltip)} className="flex items-center gap-0.5 text-[11px] text-muted-foreground mx-auto mt-0.5">
                <HelpCircle className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showRateTooltip && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl border border-border bg-card shadow-lg z-10">
                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed">How often you actually show up to confirmed plans. Keep it high to stay reliable! 💪</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Groups shortcut */}
        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate('/groups')} className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-all mb-4">
          <Users className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">My Groups</p>
            <p className="text-xs text-muted-foreground">View and manage your groups</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Menu items */}
        <div className="space-y-2 mb-6">
          {[
            { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
            { icon: Calendar, label: 'Calendar Sync', desc: 'Connect calendars' },
            { icon: Shield, label: 'Privacy', desc: 'Control your data' },
          ].map(item => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => item.label === 'Notifications' ? navigate('/notifications') : (() => { setShowComingSoon(item.label); setTimeout(() => setShowComingSoon(null), 2000); })()}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-all"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all mb-8">
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="text-sm font-semibold text-destructive">Sign Out</span>
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;
