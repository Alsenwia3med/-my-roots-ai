"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Anchor, SceneVariant } from "./three/scenes";

/**
 * A decorative WebGL scene. three.js loads only on the client, only when this component mounts,
 * so pages without a scene never download it. If WebGL is unavailable the soft halo behind the
 * canvas remains, so the layout never shows a hole.
 */
export default function Scene3D({
  variant,
  className = "",
  onAnchors,
  fps,
  children,
}: {
  variant: SceneVariant;
  className?: string;
  fps?: number;
  onAnchors?: (anchors: Anchor[]) => void;
  children?: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anchorsRef = useRef(onAnchors);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    anchorsRef.current = onAnchors;
  }, [onAnchors]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./three/scenes")
      .then(({ mountScene }) => {
        if (cancelled) return;
        try {
          dispose = mountScene(host, canvas, variant, {
            reduced,
            fps,
            onAnchors: anchorsRef.current ? (a) => anchorsRef.current?.(a) : undefined,
          });
          requestAnimationFrame(() => setReady(true));
        } catch {
          /* no WebGL: the CSS halo stays as the visual */
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [variant, fps]);

  return (
    <div ref={hostRef} className={`lx3d ${className}`.trim()} data-ready={ready ? "true" : "false"} data-variant={variant}>
      <div className="lx3d-halo" aria-hidden="true" />
      <canvas ref={canvasRef} className="lx3d-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}
