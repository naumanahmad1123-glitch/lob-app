import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, List, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';
import { useComposer } from '@/hooks/useComposer';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { seedDemoData } from '@/lib/seed-demo';
import { Lob } from '@/data/types';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'feed' | 'calendar';
type FeedTab = 'pending' | 'upcoming' | 'archived';
type ArchiveWindow = '7d' | '30d' | '90d' | 'all';

const ARCHIVE_WINDOWS: { value: ArchiveWindow; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

const WINDOW_MS: Record<Exclude<ArchiveWindow, 'all'>, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

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
  const hasShownContent = useRef(false);
  useEffect(() => { if (!isLoading) hasShownContent.current = true; }, [isLoading]);
  const queryClient = useQueryClient();
  const unreadCount = useUnreadNotificationCount();
  const [view, setView] = useState<ViewMode>('feed');
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>('pending');
  const [archiveWindow, setArchiveWindow] = useState<ArchiveWindow>('7d');

  // Seed demo data on first login if user has no lobs
  useEffect(() => {
    if (user && !isLoading && allLobs.length === 0) {
      seedDemoData(user.id);
    }
  }, [user?.id, isLoading, allLobs.length]);

  const pendingLobs = allLobs.filter(l =>
    (l.status === 'voting' || l.status === 'confirmed') &&
    !l.responses.some(r => r.userId === user?.id && (r.response === 'in' || r.response === 'out' || r.response === 'maybe'))
  );

  const upcomingLobs = useMemo(() => {
    const filtered = allLobs.filter(l => {
      if (l.status === 'cancelled' || l.status === 'completed') return false;
      const myResp = l.responses.find(r => r.userId === user?.id);
      return myResp?.response === 'in' || myResp?.response === 'maybe';
    });

    // Sort: confirmed first, then needs more votes (voting + user is "in"), then maybe
    return filtered.sort((a, b) => {
      const myRespA = a.responses.find(r => r.userId === user?.id)?.response;
      const myRespB = b.responses.find(r => r.userId === user?.id)?.response;

      const rank = (lob: typeof a, resp: string | undefined) => {
        if (lob.status === 'confirmed') return 0;           // Confirmed
        if (lob.status === 'voting' && resp === 'in') return 1; // Needs more votes
        if (resp === 'maybe') return 2;                      // You answered Maybe
        return 3;
      };

      return rank(a, myRespA) - rank(b, myRespB);
    });
  }, [allLobs, user?.id]);

  const archivedLobs = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return allLobs.filter(l => {
      const isArchived = l.status === 'cancelled' || l.status === 'completed' ||
        l.responses.find(r => r.userId === user?.id)?.response === 'out';
      if (!isArchived) return false;

      const lobDate = new Date(l.selectedTime || l.createdAt).getTime();

      // Always hide cancelled lobs older than 7 days
      if (l.status === 'cancelled' && now - lobDate > sevenDaysMs) return false;

      // Apply window filter for non-cancelled archived lobs
      if (archiveWindow !== 'all') {
        if (now - lobDate > WINDOW_MS[archiveWindow]) return false;
      }

      return true;
    });
  }, [allLobs, user?.id, archiveWindow]);

  const needsConfirmation = allLobs.filter(l => {
    const myResp = l.responses.find(r => r.userId === user?.id);
    return myResp?.response === 'maybe' && myResp?.comment === 'standby-promoted';
  });

  const allUpcoming = upcomingLobs;

  const handleConfirmSpot = async (lobId: string) => {
    if (!user) return;
    await supabase.from('lob_responses').update({ response: 'in', comment: null }).eq('lob_id', lobId).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['supabase-lobs'] });
  };

  const handlePassSpot = async (lobId: string) => {
    if (!user) return;
    await supabase.from('lob_responses').update({ response: 'out', comment: null }).eq('lob_id', lobId).eq('user_id', user.id);

    // Fetch fresh standby list and promote next person
    const { data: responses } = await supabase
      .from('lob_responses')
      .select('*')
      .eq('lob_id', lobId)
      .eq('response', 'standby')
      .order('standby_since', { ascending: true })
      .limit(1);

    if (responses && responses.length > 0) {
      await supabase
        .from('lob_responses')
        .update({ response: 'maybe', comment: 'standby-promoted' })
        .eq('lob_id', lobId)
        .eq('user_id', responses[0].user_id);
    }

    queryClient.invalidateQueries({ queryKey: ['supabase-lobs'] });
  };

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
      <div className="w-full px-4">
        <div className="flex items-center justify-between pt-2 pb-2">
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Lob</h1>
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

        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 mb-3">
          <button
            onClick={() => setView('feed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              view === 'feed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <List className="w-4 h-4" />
            Feed
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
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
                initial={hasShownContent.current ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 mb-3">
                  {([
                    { key: 'pending' as FeedTab, label: 'Needs Vote' },
                    { key: 'upcoming' as FeedTab, label: 'Upcoming' },
                    { key: 'archived' as FeedTab, label: 'Archived' },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFeedTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        feedTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      {tab.label}
                      {tab.key === 'pending' && pendingLobs.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold">{pendingLobs.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {feedTab === 'archived' && (
                  <div className="flex items-center gap-1.5 mb-3">
                    {ARCHIVE_WINDOWS.map(w => (
                      <button
                        key={w.value}
                        onClick={() => setArchiveWindow(w.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          archiveWindow === w.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {feedTab === 'pending' && (
                    <motion.div
                      key="pending"
                      initial={hasShownContent.current ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {pendingLobs.length > 0 ? (
                        <div className="space-y-2">
                          {pendingLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}
                        </div>
                      ) : (
                        <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
                          <span className="text-4xl mb-3 block">✅</span>
                          <p className="text-sm font-semibold text-foreground">You're all caught up</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {feedTab === 'upcoming' && (
                    <motion.div
                      key="upcoming"
                      initial={hasShownContent.current ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {needsConfirmation.length + upcomingLobs.length > 0 ? (
                        <div className="space-y-2">
                          {needsConfirmation.map(lob => (
                            <div key={lob.id} className="relative">
                              <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">Confirm your spot</span>
                              <div className="gradient-card rounded-2xl p-3 border border-orange-500/30 shadow-card">
                                <p className="text-sm font-semibold text-foreground mb-1">{lob.title} — a spot opened up!</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleConfirmSpot(lob.id)}
                                    className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
                                  >
                                    I'm In
                                  </button>
                                  <button
                                    onClick={() => handlePassSpot(lob.id)}
                                    className="flex-1 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
                                  >
                                    Pass
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(() => {
                            const confirmed = upcomingLobs.filter(l => l.status === 'confirmed');
                            const needsVotes = upcomingLobs.filter(l => l.status === 'voting' && l.responses.find(r => r.userId === user?.id)?.response === 'in');
                            const maybeLobs = upcomingLobs.filter(l => l.responses.find(r => r.userId === user?.id)?.response === 'maybe');
                            return (
                              <>
                                {confirmed.length > 0 && (
                                  <>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-1">Confirmed</p>
                                    {confirmed.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}
                                  </>
                                )}
                                {needsVotes.length > 0 && (
                                  <>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-1">Needs more votes</p>
                                    {needsVotes.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}
                                  </>
                                )}
                                {maybeLobs.length > 0 && (
                                  <>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-1">You answered maybe</p>
                                    {maybeLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
                          <span className="text-4xl mb-3 block">🏐</span>
                          <p className="text-sm font-semibold text-foreground">Nothing lined up yet</p>
                          <button
                            onClick={() => openComposer()}
                            className="mt-4 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
                          >
                            Lob Something
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {feedTab === 'archived' && (
                    <motion.div
                      key="archived"
                      initial={hasShownContent.current ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {archivedLobs.length > 0 ? (
                        <div className="space-y-2">
                          {archivedLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}
                        </div>
                      ) : (
                        <div className="gradient-card rounded-2xl border border-border/50 p-8 text-center">
                          <span className="text-4xl mb-3 block">📦</span>
                          <p className="text-sm font-semibold text-foreground">Nothing archived yet</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={hasShownContent.current ? { opacity: 0, x: 20 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer active:scale-95 transition-transform">‹</button>
                  <h2 className="text-sm font-bold text-foreground">{monthLabel}</h2>
                  <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer active:scale-95 transition-transform">›</button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_OF_WEEK.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={i} />;
                    const hasLobs = lobsByDay.has(day);
                    const isToday = isCurrentMonth && day === today.getDate();
                    const isSelected = day === selectedDay;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all cursor-pointer ${
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
                      <h3 className="text-sm font-bold text-foreground mb-2">
                        {new Date(calMonth.year, calMonth.month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      {selectedDayLobs.length > 0 ? (
                        <div className="space-y-2">{selectedDayLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}</div>
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
