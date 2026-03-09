import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShowRateBadgeProps {
  /** Total confirmed lobs */
  total: number;
  /** Times the user actually showed up */
  showed: number;
  /** Compact mode for inline use next to avatars */
  compact?: boolean;
}

export function ShowRateBadge({ total, showed, compact = false }: ShowRateBadgeProps) {
  const isNew = total < 5;

  const label = useMemo(() => {
    if (isNew) return 'New';
    return 'Show Rate';
  }, [isNew]);

  const shortLabel = useMemo(() => {
    if (isNew) return '🆕';
    const rate = Math.round((showed / total) * 100);
    return `${rate}%`;
  }, [total, showed, isNew]);

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none ${
                isNew
                  ? 'bg-muted text-muted-foreground'
                  : showed / total >= 0.8
                    ? 'bg-lob-in/15 text-lob-in'
                    : showed / total >= 0.5
                      ? 'bg-lob-maybe/15 text-lob-maybe'
                      : 'bg-lob-out/15 text-lob-out'
              }`}
            >
              {shortLabel}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="text-center">
      <p
        className={`text-xl font-bold ${
          isNew
            ? 'text-muted-foreground'
            : showed / total >= 0.8
              ? 'text-primary'
              : showed / total >= 0.5
                ? 'text-lob-maybe'
                : 'text-lob-out'
        }`}
      >
        {isNew ? '—' : `${Math.round((showed / total) * 100)}%`}
      </p>
      <p className="text-[11px] text-muted-foreground">{isNew ? 'New member' : label}</p>
    </div>
  );
}
