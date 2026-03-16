import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Repeat, Crown, CalendarRange, Globe, Users, HelpCircle, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Lob, CATEGORY_CONFIG, RECURRENCE_OPTIONS, FLEXIBLE_WINDOW_OPTIONS } from '@/data/types';
import { getEmojiForTitle } from '@/lib/lob-utils';
import { useAuth } from '@/contexts/AuthContext';
import { QuorumBar } from './QuorumBar';
import { StatusPill } from './StatusPill';

interface LobCardProps {
  lob: Lob;
  index?: number;
}

function getTripPhaseLabel(lob: Lob): { label: string; color: string } {
  const phase = lob.tripPlanningPhase;
  if (phase === 'voting-destination') return { label: '🗺️ Voting on destination', color: 'text-lob-maybe' };
  if (phase === 'voting-dates') return { label: '📅 Voting on dates', color: 'text-primary' };
  if (phase === 'confirmed' && lob.tripStartDate && lob.tripEndDate) {
    const start = new Date(lob.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(lob.tripEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: `✅ Confirmed: ${start} – ${end}`, color: 'text-lob-confirmed' };
  }
  // Fallback for legacy data
  if (lob.tripStartDate && lob.tripEndDate) {
    const start = new Date(lob.tripStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(lob.tripEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: `${start} – ${end}`, color: 'text-muted-foreground' };
  }
  return { label: 'Dates TBD', color: 'text-muted-foreground' };
}

export function LobCard({ lob, index = 0 }: LobCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const config = CATEGORY_CONFIG[lob.category];
  const isYours = lob.createdBy === user?.id;
  const inCount = lob.responses.filter(r => r.response === 'in').length;
  const isGroupTrip = lob.category === 'group-trip';
  const timeStr = lob.selectedTime || lob.timeOptions[0]?.datetime;
  const formattedTime = (() => {
    if (lob.whenMode === 'tbd') return 'Time TBD';
    if (lob.whenMode === 'flexible' && lob.flexibleWindow) {
      return FLEXIBLE_WINDOW_OPTIONS.find(o => o.key === lob.flexibleWindow)?.displayLabel || 'Flexible';
    }
    if (timeStr) {
      return new Date(timeStr).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return 'TBD';
  })();
  const recurrenceLabel = lob.recurrence
    ? RECURRENCE_OPTIONS.find(r => r.key === lob.recurrence)?.label
    : null;

  if (isGroupTrip) {
    const phaseInfo = getTripPhaseLabel(lob);
    const modeIcon = lob.tripPlanningMode === 'fully-open' ? '🌐' : lob.tripPlanningMode === 'dates-open' ? '📅' : '✈️';

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        onClick={() => navigate(`/lob/${lob.id}`)}
        className="relative rounded-2xl p-3 shadow-card cursor-pointer active:scale-[0.98] transition-transform overflow-hidden border border-primary/20"
        style={{
          background: 'linear-gradient(145deg, hsl(18 100% 60% / 0.08), hsl(30 100% 65% / 0.04), hsl(240 8% 9%))',
        }}
      >
        {/* Accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />

        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-lg">
              {modeIcon}
              {isYours && (
                <Crown className="absolute -top-1.5 -right-1.5 w-3 h-3 text-primary fill-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-foreground text-[15px] leading-tight">
                  {(lob.destination || lob.title).replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim()}
                </h3>
                {isYours && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                    Yours
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Globe className="w-3 h-3 text-primary/60" />
                <span className="text-xs font-medium text-primary/80">Group Trip</span>
              </div>
            </div>
          </div>
          <StatusPill status={lob.status} />
        </div>

        {/* Phase status */}
        <div className={`text-xs font-semibold ${phaseInfo.color} mb-2`}>
          {phaseInfo.label}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          {lob.tripTimeframe && (
            <span className="flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5" />
              {lob.tripTimeframe}
            </span>
          )}
          {lob.tripVibes && lob.tripVibes.length > 0 && (
            <span className="flex items-center gap-1">
              {lob.tripVibes.map(v => VIBE_EMOJIS[v] || '🏖️').join(' ')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {inCount}/{lob.quorum} in
          </span>
        </div>

        {/* Destination voting progress */}
        {lob.tripPlanningPhase === 'voting-destination' && lob.destinationOptions && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {lob.destinationOptions.map(d => (
              <span key={d.id} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground">
                {d.name} · {d.votes.length}
              </span>
            ))}
          </div>
        )}

        {/* Date voting progress */}
        {lob.tripPlanningPhase === 'voting-dates' && lob.dateRangeOptions && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {lob.dateRangeOptions.map(dr => {
              const s = new Date(dr.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const e = new Date(dr.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <span key={dr.id} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground">
                  {s}–{e} · {dr.votes.length}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <QuorumBar current={inCount} target={lob.quorum} />
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/lob/${lob.id}`)}
      className="gradient-card rounded-2xl p-3 shadow-card border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative text-2xl">
            {config.emoji}
            {isYours && (
              <Crown className="absolute -top-1.5 -right-1.5 w-3 h-3 text-primary fill-primary" />
            )}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground text-[15px] leading-tight">{lob.title.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim()}</h3>
              {isYours && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                  Yours
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{lob.groupName}</p>
          </div>
        </div>
        <StatusPill status={lob.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formattedTime}
        </span>
        {(lob.locationName || lob.location) && (
          <span className="flex items-center gap-1 truncate max-w-[150px]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lob.locationName || lob.location}</span>
          </span>
        )}
        {recurrenceLabel && (
          <span className="flex items-center gap-1 text-primary">
            <Repeat className="w-3 h-3" />
            {recurrenceLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <QuorumBar current={inCount} target={lob.quorum} />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

const VIBE_EMOJIS: Record<string, string> = {
  beach: '🏖️',
  city: '🏙️',
  adventure: '🧗',
  ski: '⛷️',
  cultural: '🏛️',
  roadtrip: '🚗',
};
