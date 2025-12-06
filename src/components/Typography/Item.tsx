import React, { useId, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

type ItemProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  tier?: number;
  tooltipImg?: string;
  tooltipContent?: React.ReactNode;
  tooltipWidthClass?: string; // e.g. "w-72" or "min-w-72 w-max"
  portalTooltip?: boolean;
};

const TIER_TEXT: Record<number, string> = {
  1: "text-neutral-400",
  2: "text-emerald-400",
  3: "text-sky-400",
  4: "text-violet-400",
  5: "text-amber-300",
};

const TIER_BORDER: Record<number, string> = {
  1: "border-neutral-400",
  2: "border-emerald-400",
  3: "border-sky-400",
  4: "border-purple-400",
  5: "border-yellow-400",
};

const Item = ({
  name,
  tier = 1,
  className = "",
  tooltipImg,
  tooltipContent,
  tooltipWidthClass = "min-w-48 w-max",
  portalTooltip = true,
  ...rest
}: ItemProps) => {
  const textClass = TIER_TEXT[tier] ?? "text-neutral-300";
  const borderClass = TIER_BORDER[tier] ?? "border-neutral-400";

  const hasTooltip = !!tooltipContent;
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !portalTooltip || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, portalTooltip]);

  return (
    <span
      ref={anchorRef}
      className={[
        "relative inline-flex items-center font-bold group cursor-pointer",
        textClass,
        className,
      ].join(" ")}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
      onMouseEnter={() => hasTooltip && setOpen(true)}
      onMouseLeave={() => hasTooltip && setOpen(false)}
      onFocus={() => hasTooltip && setOpen(true)}
      onBlur={() => setOpen(false)}
      {...rest}
    >
      {name}

      {hasTooltip && (
        <>
          {/* Non-portal fallback (same pattern as ItemTile) */}
          {!portalTooltip && (
            <div
              id={tooltipId}
              role="tooltip"
              className={[
                "pointer-events-none absolute left-1/2 top-full z-[9999] mt-2 -translate-x-1/2",
                "rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-xl",
                "px-4 py-3 text-sm text-left",
                tooltipWidthClass,
                "opacity-0 scale-95 transition-all duration-150 ease-out",
                "group-hover:opacity-100 group-hover:scale-100",
                "group-focus-within:opacity-100 group-focus-within:scale-100",
              ].join(" ")}
            >
              <article className="text-stone-400 leading-snug flex gap-2">
                {tooltipImg ? (
                  <img
                    src={tooltipImg}
                    alt=""
                    className={[
                      "w-16 h-16 object-cover rounded-xl border-2",
                      borderClass,
                    ].join(" ")}
                  />
                ) : null}
                <section>
                  <span className={["font-bold", textClass].join(" ")}>
                    {name}
                  </span>
                  <div className="font-normal">{tooltipContent}</div>
                </section>
              </article>
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-45 h-3 w-3 border-l border-t border-neutral-700 bg-neutral-900"
              />
            </div>
          )}

          {/* Portal tooltip (fixed to viewport, same as ItemTile) */}
          {portalTooltip &&
            open &&
            pos &&
            createPortal(
              <div
                id={tooltipId}
                role="tooltip"
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  transform: "translateX(-50%)",
                  zIndex: 9999,
                }}
                className={[
                  "pointer-events-none",
                  "rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-xl",
                  "px-4 py-3 text-sm text-left",
                  tooltipWidthClass,
                ].join(" ")}
              >
                <article className="text-stone-400 leading-snug flex gap-2">
                  {tooltipImg ? (
                    <img
                      src={tooltipImg}
                      alt=""
                      className={[
                        "w-16 h-16 object-cover rounded-xl border-2",
                        borderClass,
                      ].join(" ")}
                    />
                  ) : null}
                  <section>
                    <span className={["font-bold", textClass].join(" ")}>
                      {name}
                    </span>
                    <div className="font-normal">{tooltipContent}</div>
                  </section>
                </article>
              </div>,
              document.body
            )}
        </>
      )}
    </span>
  );
};

export default Item;
