import React, {
  useId,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";

type ItemProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  tier?: number;
  tooltipImg?: string;
  tooltipContent?: React.ReactNode;
  tooltipWidthClass?: string; // e.g. "w-72" (optional)
};

const TIER_CLASSES: Record<number, string> = {
  1: "neutral-400",
  2: "emerald-400",
  3: "sky-400",
  4: "violet-400",
  5: "amber-300",
};

const EDGE_PADDING = 8; // px from viewport edges

const Item = ({
  name,
  tier = 1,
  className = "",
  tooltipImg,
  tooltipContent,
  tooltipWidthClass = "min-w-72 w-max max-w-[90vw] sm:max-w-md",
  ...rest
}: ItemProps) => {
  const color = TIER_CLASSES[tier] ?? "neutral-300";
  const hasTooltip = !!tooltipContent;
  const tooltipId = useId();

  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const [shiftX, setShiftX] = useState(0);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;

    // Temporarily neutralize transitions/transforms so we measure real size
    const prevTransition = tip.style.transition;
    const prevOpacity = tip.style.opacity;
    const prevTransform = tip.style.transform;
    const prevDisplay = tip.style.display;

    tip.style.transition = "none";
    tip.style.opacity = "0";
    tip.style.display = "block";
    tip.style.transform = "none"; // neither scale nor translate while measuring

    const tRect = trigger.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const vw = window.innerWidth;

    // If centered relative to the trigger:
    const centeredLeft = tRect.left + (tRect.width - tipRect.width) / 2;

    // Clamp to stay inside viewport with padding
    const minLeft = EDGE_PADDING;
    const maxLeft = vw - EDGE_PADDING - tipRect.width;
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centeredLeft));

    // Translate relative to the trigger's left edge
    const translateX = Math.round(clampedLeft - tRect.left);
    setShiftX(translateX);

    // Restore styles
    tip.style.transition = prevTransition;
    tip.style.opacity = prevOpacity;
    tip.style.transform = prevTransform;
    tip.style.display = prevDisplay;
  }, []);

  useLayoutEffect(() => {
    if (!hasTooltip) return;
    const onResizeScroll = () => reposition();
    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll);
    };
  }, [hasTooltip, reposition]);

  const onShow = () => reposition();

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center font-bold group text-${color} ${className} cursor-pointer text-nowrap`}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
      onMouseEnter={hasTooltip ? onShow : undefined}
      onFocus={hasTooltip ? onShow : undefined}
      {...rest}
    >
      {name}

      {hasTooltip && (
        <>
          <span
            ref={tipRef}
            id={tooltipId}
            role="tooltip"
            className={[
              "pointer-events-none absolute left-0 top-full z-50 mt-2",
              "rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-xl",
              "px-4 py-3 text-sm text-left",
              tooltipWidthClass,
              "whitespace-normal break-words",
              "opacity-0 scale-95 transition-all duration-150 ease-out",
              "group-hover:opacity-100 group-hover:scale-100",
              "group-focus-within:opacity-100 group-focus-within:scale-100",
            ].join(" ")}
            style={{
              transform: `translateX(${shiftX}px)`,
              maxWidth: `calc(100vw - ${EDGE_PADDING * 2}px)`,
            }}
          >
            {tooltipContent && (
              <article className="text-stone-400 leading-snug flex gap-2">
                {tooltipImg && (
                  <img
                    src={tooltipImg}
                    alt=""
                    className={`w-24 h-16 object-cover border-2 border-${color} rounded-xl`}
                    onLoad={reposition} // <-- remeasure after img load
                  />
                )}
                <section className="whitespace-normal break-words">
                  <span className={`font-bold text-${color} block`}>
                    {name}
                  </span>
                  <div className="font-normal">{tooltipContent}</div>
                </section>
              </article>
            )}

            {/* caret */}
            <span
              aria-hidden
              className="absolute -top-2 left-1/2 rotate-45 h-3 w-3 border-l border-t border-neutral-700 bg-neutral-900"
              style={{ transform: `translateX(${shiftX}px) rotate(45deg)` }}
            />
          </span>
        </>
      )}
    </span>
  );
};

export default Item;
