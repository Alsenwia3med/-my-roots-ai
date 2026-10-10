import { cn } from "@/lib/utils";

export interface ScoreBarProps {
  label: string;
  score: number;
  max?: number;
  className?: string;
}

export default function ScoreBar({ label, score, max = 100, className }: ScoreBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <span>{label}</span>
        <span>{score}/{max}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
