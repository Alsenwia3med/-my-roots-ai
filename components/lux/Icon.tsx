import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

export type IconTone = "teal" | "mint" | "ocean" | "deep" | "light" | "glass";

/**
 * An app icon in the manner of iOS health apps: a continuous-corner tile with a glossy
 * gradient, an inner rim of light, a soft coloured shadow and a crisp white glyph.
 * Decorative only — the text beside it always carries the meaning.
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
      <span className="lx-ico-gloss" />
      <Glyph strokeWidth={2} absoluteStrokeWidth={false} />
    </span>
  );
}

/** The ROOTS-AI mark, small, in the same tile — used where a sentence names the company itself. */
export function LogoTile({ size }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? " lx-ico--sm" : size === "lg" ? " lx-ico--lg" : "";
  return (
    <span className={`lx-ico lx-ico--logo${sizeClass}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/roots-logo.svg" alt="" width={603} height={792} />
    </span>
  );
}

/** Rotates through the brand's four icon tones so neighbouring icons never repeat a colour. */
export const TONES: IconTone[] = ["teal", "ocean", "mint", "deep"];
