import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          Step {current} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
