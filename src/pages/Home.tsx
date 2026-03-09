import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bell, List, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';
import { useComposer } from '@/hooks/useComposer';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { seedDemoData } from '@/lib/seed-demo';
import { Lob } from '@/data/types';

type ViewMode = 'feed' | 'calendar';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openComposer } = useComposer();
  const { data: allLobs = [], isLoading } = useSupabaseLobs();
  const unreadCount = useUnreadNotificationCount();
  const [view, setView] = useState<ViewMode>('feed');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Seed demo data on first login if user has no lobs
  useEffect(() => {
    if (user && !isLoading && allLobs.length === 0) {
      seedDemoData(user.id);
    }
  }, [user?.id, isLoading, allLobs.length]);

  const activeLobs = allLobs.filter(l => l.status === 'voting');
  const confirmedLobs = allLobs.filter(l => l.status === 'confirmed');
  const allUpcoming = allLobs.filter(l => l.status === 'voting' || l.status === 'confirmed');

  const lobsByDay = useMemo(() => {
    const map = new Map<number, Lob[]>();
    allUpcoming.forEach(lob => {
      const timeStr = lob.selectedTime || lob.timeOptions[0]?.datetime;
      if (!timeStr) return;
      const d = new Date(timeStr);
      if (d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(lob);
      }
    });
    return map;
  }, [allUpcoming, calMonth]);

  const calendarDays = getCalendarDays(calMonth.year, calMonth.month);
  const monthLabel = new Date(calMonth.year, calMonth.month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === calMonth.year && today.getMonth() === calMonth.month;
  const selectedDayLobs = selectedDay ? lobsByDay.get(selectedDay) || [] : [];

  const prevMonth = () => {
    setSelectedDay(null);
    setCalMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 });
  };
  const nextMonth = () => {
    setSelectedDay(null);
    setCalMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 });
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Lob</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Make plans, not excuses</p>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 mb-6">
          <button
            onClick={() => setView('feed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'feed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <List className="w-4 h-4" />
            Feed
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Loading plans...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'feed' ? (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeLobs.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-foreground">Needs Your Vote</h2>
                      <span className="text-xs font-semibold text-primary">{activeLobs.length} active</span>
                    </div>
                    <div className="space-y-3">
                      {activeLobs.map((lob, i) => (
                        <LobCard key={lob.id} lob={lob} index={i} />
                      ))}
                    </div>
                  </section>
                )}

                {confirmedLobs.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-base font-bold text-foreground mb-3">Upcoming</h2>
                    <div className="space-y-3">
                      {confirmedLobs.map((lob, i) => (
                        <LobCard key={lob.id} lob={lob} index={i} />
                      ))}
                    </div>
                  </section>
                )}

                {allLobs.length === 0 && (
                  <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
                    <span className="text-4xl mb-3 block">🏐</span>
                    <p className="text-sm font-semibold text-foreground">No plans yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Lob something to get started!</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">‹</button>
                  <h2 className="text-base font-bold text-foreground">{monthLabel}</h2>
                  <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">›</button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_OF_WEEK.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={i} />;
                    const hasLobs = lobsByDay.has(day);
                    const isToday = isCurrentMonth && day === today.getDate();
                    const isSelected = day === selectedDay;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                          isSelected ? 'bg-primary text-primary-foreground'
                            : isToday ? 'bg-accent/20 text-accent'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {day}
                        {hasLobs && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence mode="wait">
                  {selectedDay && (
                    <motion.div key={selectedDay} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}>
                      <h3 className="text-sm font-bold text-foreground mb-3">
                        {new Date(calMonth.year, calMonth.month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      {selectedDayLobs.length > 0 ? (
                        <div className="space-y-3">{selectedDayLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}</div>
                      ) : (
                        <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                          <p className="text-sm text-muted-foreground">No plans this day</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {!selectedDay && (
                  <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                    <CalendarDays className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tap a day to see plans</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div className="h-8" />
      </div>
    </AppLayout>
  );
};

export default Home;
