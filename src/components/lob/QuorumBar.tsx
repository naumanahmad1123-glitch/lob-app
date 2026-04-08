interface QuorumBarProps {
  current: number;
  target: number;
}

export function QuorumBar({ current, target }: QuorumBarProps) {
  const pct = Math.min((current / target) * 100, 100);
  const reached = current >= target;
  const remaining = Math.max(target - current, 0);

  return (
    <div className="flex items-center gap-2 flex-1 mr-2">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reached ? 'bg-lob-confirmed' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${reached ? 'text-lob-confirmed' : 'text-muted-foreground'}`}>
        {reached ? "It's on! 🎉" : `Waiting on ${remaining} ${remaining === 1 ? 'person' : 'people'}`}
      </span>
    </div>
  );
}
