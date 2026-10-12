import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

export type IconTone = "teal" | "light" | "glass";

/**
 * An iOS-style app-icon tile: a squircle with a deep teal gradient, a glassy top sheen and a
 * thin-stroke glyph. Decorative only — the text beside it always carries the meaning.
 */
export function IconTile({
  icon: Glyph,
  tone = "teal",
  size,
  className = "",
}: {
  icon: LucideIcon;
  tone?: IconTone;
  size?: "sm" | "md" | "lg" | number;
  className?: string;
}) {
  const sizeClass = size === "sm" ? " lx-ico--sm" : size === "lg" ? " lx-ico--lg" : "";
  const style = typeof size === "number" ? ({ "--s": `${size}px` } as CSSProperties) : undefined;
  return (
    <span className={`lx-ico lx-ico--${tone}${sizeClass} ${className}`.trim()} style={style} aria-hidden="true">
      <Glyph strokeWidth={1.7} absoluteStrokeWidth={false} />
    </span>
  );
}
