import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bell, List, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { lobs as seedLobs, suggestedLobs } from '@/data/seed';
import { CATEGORY_CONFIG } from '@/data/types';
import { useCreatedLobs } from '@/hooks/useCreatedLobs';

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
  const createdLobs = useCreatedLobs();
  const allLobs = useMemo(() => [...createdLobs, ...seedLobs], [createdLobs]);
  const [view, setView] = useState<ViewMode>('feed');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const activeLobs = allLobs.filter(l => l.status === 'voting');
  const confirmedLobs = allLobs.filter(l => l.status === 'confirmed');
  const allUpcoming = allLobs.filter(l => l.status === 'voting' || l.status === 'confirmed');

  // Map day-of-month → lobs for the current calendar month
  const lobsByDay = useMemo(() => {
    const map = new Map<number, typeof allLobs>();
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
        {/* Header */}
        <div className="flex items-center justify-between pt-12 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Lob</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Make plans, not excuses</p>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              3
            </span>
          </button>
        </div>

        {/* View toggle */}
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

        <AnimatePresence mode="wait">
          {view === 'feed' ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Active Lobs */}
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

              {/* Confirmed */}
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

              {/* AI Suggestions */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Lobster Suggests</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                  {suggestedLobs.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="min-w-[160px] gradient-card border border-border/50 rounded-2xl p-4 shadow-card cursor-pointer active:scale-[0.97] transition-transform"
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <p className="text-sm font-semibold text-foreground mt-2 leading-tight">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.time}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                  ‹
                </button>
                <h2 className="text-base font-bold text-foreground">{monthLabel}</h2>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                  ›
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
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
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isToday
                            ? 'bg-accent/20 text-accent'
                            : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      {day}
                      {hasLobs && (
                        <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-primary-foreground' : 'bg-primary'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected day's lobs */}
              <AnimatePresence mode="wait">
                {selectedDay && (
                  <motion.div
                    key={selectedDay}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h3 className="text-sm font-bold text-foreground mb-3">
                      {new Date(calMonth.year, calMonth.month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    {selectedDayLobs.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDayLobs.map((lob, i) => (
                          <LobCard key={lob.id} lob={lob} index={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                        <p className="text-sm text-muted-foreground">No plans this day</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Lob something!</p>
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

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </AppLayout>
  );
};

export default Home;
