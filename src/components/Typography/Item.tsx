import React, {
  useId,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

type ItemProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  tier?: number;
  tooltipImg?: string;
  tooltipContent?: React.ReactNode;
  tooltipWidthClass?: string; // e.g. "w-72"
  itemType?: string;
};

const TIER_CLASSES: Record<number, string> = {
  1: "neutral-400",
  2: "emerald-400",
  3: "sky-400",
  4: "violet-400",
  5: "amber-300",
};

const EDGE_PADDING = 8; // px from viewport edges
const GAP = 8; // gap between trigger and tooltip
const FADE_MS = 150;

const Item = ({
  name,
  tier = 1,
  className = "",
  tooltipImg,
  tooltipContent,
  tooltipWidthClass = "min-w-72 w-max max-w-[90vw] sm:max-w-md",
  itemType = "item",
  ...rest
}: ItemProps) => {
  const color = TIER_CLASSES[tier] ?? "neutral-300";
  const hasTooltip = !!tooltipContent;
  const tooltipId = useId();

  const triggerRef = useRef<HTMLSpanElement | null>(null);

  // lifecycle flags
  const [mounted, setMounted] = useState(false); // actually render tooltip?
  const [visible, setVisible] = useState(false); // play fade
  const hideTimer = useRef<number | null>(null);

  const imgWidthClass = itemType === "item" ? "w-16" : "w-24";

  // computed placement
  const [coords, setCoords] = useState<{ left: number; top: number }>({
    left: -9999,
    top: -9999,
  });
  const [caretX, setCaretX] = useState<number>(0); // px within tooltip

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  /**
   * Measure using an off-screen hidden clone appended to <body>.
   * Returns { width, height } synchronously (because sizes come from CSS).
   */
  const measureTooltip = useCallback(() => {
    const container = document.createElement("div");
    // replicate “box” styles for measuring
    container.className = [
      "fixed", // fixed so it never adds layout
      "left-[-9999px]",
      "top-[-9999px]",
      "z-[99999]",
      "px-4 py-3 text-sm text-left whitespace-normal break-words",
      "rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-xl",
      tooltipWidthClass,
    ].join(" ");

    // content shell (image is sized by classes, so measurement is correct even before load)
    container.innerHTML = `
      <article class="text-stone-400 leading-snug flex gap-2">
        ${
          tooltipImg
            ? `<img src="${tooltipImg}" class="${imgWidthClass} h-16 object-cover border-2 rounded-xl" />`
            : ""
        }
        <section class="whitespace-normal break-words">
          <span class="font-bold block">${name}</span>
          <div class="font-normal">${
            typeof tooltipContent === "string" ? tooltipContent : ""
          }</div>
        </section>
      </article>
    `;

    document.body.appendChild(container);
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    document.body.removeChild(container);
    return { width, height };
  }, [name, tooltipContent, tooltipImg, tooltipWidthClass]);

  const computePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const tRect = trigger.getBoundingClientRect();
    const { width: tipW, height: tipH } = measureTooltip();

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const centerX = tRect.left + tRect.width / 2;

    // Center horizontally, clamp to viewport
    let left = Math.round(centerX - tipW / 2);
    left = clamp(left, EDGE_PADDING, vw - EDGE_PADDING - tipW);

    // Prefer below; flip above if it would overflow bottom
    let top = Math.round(tRect.bottom + GAP);
    if (
      top + tipH + EDGE_PADDING > vh &&
      tRect.top - GAP - tipH > EDGE_PADDING
    ) {
      top = Math.round(tRect.top - GAP - tipH);
    }

    // Caret X inside tooltip
    const caretWithin = Math.round(centerX - left);
    const caretClamp = clamp(caretWithin, 10, tipW - 10);

    setCoords({ left, top });
    setCaretX(caretClamp);
  }, [measureTooltip]);

  // open/close
  const open = useCallback(() => {
    if (!hasTooltip) return;
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    // 1) compute placement BEFORE mounting (no layout changes)
    computePlacement();
    // 2) mount, then show (fade)
    setMounted(true);
    // next frame → visible
    requestAnimationFrame(() => setVisible(true));
  }, [hasTooltip, computePlacement]);

  const close = useCallback(() => {
    if (!mounted) return;
    setVisible(false);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setMounted(false);
    }, FADE_MS) as unknown as number;
  }, [mounted]);

  // Recompute on resize/scroll *while open* (no flicker; portal is fixed)
  useLayoutEffect(() => {
    if (!mounted) return;
    const onRS = () => computePlacement();
    window.addEventListener("resize", onRS);
    window.addEventListener("scroll", onRS, { passive: true });
    return () => {
      window.removeEventListener("resize", onRS);
      window.removeEventListener("scroll", onRS);
    };
  }, [mounted, computePlacement]);

  // clean up timer on unmount
  useLayoutEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center font-bold group text-${color} ${className} cursor-pointer`}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      {...rest}
    >
      {name}

      {/* Render the tooltip into <body> so it never affects layout */}
      {hasTooltip &&
        mounted &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.top,
              pointerEvents: "none", // important: don't steal hover → prevents flicker
            }}
            className={[
              "z-[99999]",
              "rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-xl",
              "px-4 py-3 text-sm text-left",
              tooltipWidthClass,
              "whitespace-normal break-words",
              "transition-all duration-150 ease-out",
              visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1.5",
            ].join(" ")}
          >
            <article className="text-stone-400 leading-snug flex gap-2">
              {tooltipImg && (
                <img
                  src={tooltipImg}
                  alt=""
                  className={`${imgWidthClass} h-16 object-cover border-2 border-${color} rounded-xl`}
                  onLoad={() => mounted && computePlacement()}
                />
              )}
              <section className="whitespace-normal break-words">
                <span className={`font-bold text-${color} block`}>{name}</span>
                <div className="font-normal">{tooltipContent}</div>
              </section>
            </article>

            {/* caret */}
            <span
              aria-hidden
              className="absolute h-3 w-3 rotate-45 border-l border-t border-neutral-700 bg-neutral-900"
              style={{
                left: caretX - 6, // center 12px caret
                // pick top/bottom based on whether we flipped
                top:
                  coords.top <
                  (triggerRef.current?.getBoundingClientRect().top ?? 0)
                    ? undefined
                    : -6,
                bottom:
                  coords.top <
                  (triggerRef.current?.getBoundingClientRect().top ?? 0)
                    ? -6
                    : undefined,
              }}
            />
          </div>,
          document.body
        )}
    </span>
  );
};

export default Item;
