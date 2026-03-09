import { LobStatus } from '@/data/types';

const statusStyles: Record<LobStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  voting: 'bg-lob-voting/20 text-lob-voting',
  confirmed: 'bg-lob-confirmed/20 text-lob-confirmed',
  cancelled: 'bg-destructive/20 text-destructive',
  completed: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<LobStatus, string> = {
  draft: 'Draft',
  voting: 'Waiting for responses',
  confirmed: '🎉 Confirmed',
  cancelled: 'Cancelled',
  completed: 'Done',
};

interface StatusPillProps {
  status: LobStatus;
  deadlinePassed?: boolean;
  quorumReached?: boolean;
}

export function StatusPill({ status, deadlinePassed, quorumReached }: StatusPillProps) {
  // Override display based on conditions
  let displayLabel = statusLabels[status];
  let displayStyle = statusStyles[status];

  if (status === 'voting' && quorumReached) {
    displayLabel = '🎉 Confirmed';
    displayStyle = statusStyles.confirmed;
  } else if (status === 'voting' && deadlinePassed) {
    displayLabel = 'Closed';
    displayStyle = 'bg-muted text-muted-foreground';
  }

  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${displayStyle}`}>
      {displayLabel}
    </span>
  );
}
