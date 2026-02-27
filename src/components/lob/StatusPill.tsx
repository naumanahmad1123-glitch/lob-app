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
  voting: 'Voting',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Done',
};

export function StatusPill({ status }: { status: LobStatus }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
