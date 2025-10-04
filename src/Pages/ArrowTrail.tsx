import { useEffect, useMemo, useRef, useState } from "react";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

type Pt = { x: number; y: number };

export default function ArrowTrail({
  start,
  end,
  stepPct = 4, // spacing between marks in %-of-width units
  scale = 1, // map height / width (for angle correction)
  speedPctPerSec = 25, // plane speed in %-of-width per second (after scale)
  pauseMs = 400, // pause before restarting loop
  maxMarks = 80, // safety cap for number of dash marks
  minDurationMs = 600, // lower bound on travel time
  maxDurationMs = 8000, // upper bound on travel time
}: {
  start: Pt | null;
  end: Pt | null;
  stepPct?: number;
  scale?: number;
  speedPctPerSec?: number;
  pauseMs?: number;
  maxMarks?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
}) {
  if (!start || !end) return null;

  // Sanitize scale so angle & spacing stay sane during layout
  const safeScale = clamp(
    Number.isFinite(scale) && scale! > 0 ? scale! : 1,
    0.2,
    5
  );

  const dx = end.x - start.x; // % of width
  const dy = end.y - start.y; // % of height

  // Correct angle by aspect ratio
  const angleDeg = (Math.atan2(dy * safeScale, dx) * 180) / Math.PI;

  // Even spacing using scaled distance
  const distanceScaled = Math.hypot(dx, dy * safeScale);

  // Compute duration from distance and speed, with safety clamps
  const rawMs =
    speedPctPerSec > 0 ? (distanceScaled / speedPctPerSec) * 1000 : 3000;
  const travelMs = clamp(rawMs, minDurationMs, maxDurationMs);

  // How many dashes to render along the path
  const rawCount = Math.max(1, Math.floor(distanceScaled / stepPct));
  const count = clamp(rawCount, 1, maxMarks);

  // Fixed dash positions (don’t overlap city dots)
  const positions = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const t = (i + 1) / (count + 1);
      return { x: start.x + dx * t, y: start.y + dy * t };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start?.x, start?.y, end?.x, end?.y, count]);

  // Smooth progress 0..1 with RAF
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const phaseRef = useRef<"run" | "pause">("run");

  useEffect(() => {
    // reset animation when path or duration changes
    setProgress(0);
    phaseRef.current = "run";
    startTimeRef.current = null;

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;

      const elapsed = now - startTimeRef.current;

      if (phaseRef.current === "run") {
        const p = clamp(elapsed / travelMs, 0, 1);
        setProgress(p);

        if (p >= 1) {
          phaseRef.current = "pause";
          startTimeRef.current = now; // reset timer for pause
        }
      } else {
        if (elapsed >= pauseMs) {
          phaseRef.current = "run";
          startTimeRef.current = now;
          setProgress(0);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [travelMs, pauseMs, start?.x, start?.y, end?.x, end?.y, count]);

  // Plane position at continuous progress t
  const planeX = start.x + dx * progress;
  const planeY = start.y + dy * progress;

  // Number of visible dashes grows with progress
  const visibleDashes = Math.min(count, Math.floor(progress * (count + 1)));

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {/* Dash trail */}
      {positions.map((p, i) => {
        const isVisible = i < visibleDashes;
        return (
          <i
            key={i}
            className="fa-solid fa-minus absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              fontSize: "clamp(10px, 1.2vw, 14px)",
              color: "#999999",
              opacity: isVisible ? 1 : 0,
              transition: "opacity 160ms linear",
            }}
            aria-hidden
          />
        );
      })}

      {/* Single smooth plane */}
      <i
        className="fa-solid fa-plane absolute"
        style={{
          left: `${planeX}%`,
          top: `${planeY}%`,
          transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
          fontSize: "clamp(12px, 1.6vw, 18px)",
          color: "#dddddd",
          opacity: phaseRef.current === "run" ? 1 : 0,
          transition: "opacity 120ms linear",
        }}
        aria-hidden
      />
    </div>
  );
}
