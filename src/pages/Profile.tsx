import { motion } from 'framer-motion';
import { Settings, ChevronRight, Bell, Calendar, Shield, Crown, LogOut, Plane, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { currentUser, trips } from '@/data/seed';

const menuItems = [
  { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
  { icon: Calendar, label: 'Calendar Sync', desc: 'Connect calendars' },
  { icon: Shield, label: 'Privacy', desc: 'Control your data' },
  { icon: Crown, label: 'Upgrade to Pro', desc: 'Unlock advanced features', highlight: true },
];

const Profile = () => {
  const navigate = useNavigate();
  const activeTrips = trips.filter(t => t.userId === currentUser.id && t.showOnProfile);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Profile</h1>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-2xl p-6 border border-border/50 shadow-card mb-6 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto flex items-center justify-center text-4xl mb-3">
            {currentUser.avatar}
          </div>
          <h2 className="text-xl font-bold text-foreground">{currentUser.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Making plans since 2026</p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-5">
            <div>
              <p className="text-xl font-bold text-foreground">12</p>
              <p className="text-[11px] text-muted-foreground">Plans Made</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">4</p>
              <p className="text-[11px] text-muted-foreground">Groups</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">92%</p>
              <p className="text-[11px] text-muted-foreground">Show Rate</p>
            </div>
          </div>

          {/* Active trip badge */}
          {activeTrips.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50">
              {activeTrips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => navigate('/sharing')}
                  className="flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
                >
                  <Plane className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-semibold text-accent">
                    {trip.emoji} {trip.city} · {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Groups shortcut */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/groups')}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-all mb-6"
        >
          <Users className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">My Groups</p>
            <p className="text-xs text-muted-foreground">View and manage your groups</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Interests */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {['🏀 Sports', '🍽️ Dinner', '☕ Coffee', '🎾 Padel'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Menu */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  item.highlight
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm mb-8">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;
