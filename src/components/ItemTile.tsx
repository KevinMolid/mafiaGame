import React, { useId, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

type ItemTileProps = {
  name: string;
  img: string;
  tier: number;
  size?: "small" | "default";
  qty?: number; // show badge when > 1
  // Tooltip (optional)
  tooltipImg?: string;
  tooltipContent?: React.ReactNode;
  tooltipWidthClass?: string; // e.g. "w-72" or "min-w-72 w-max"
  className?: string;
  portalTooltip?: boolean;
};

const TIER_BORDER: Record<number, string> = {
  1: "border-neutral-400",
  2: "border-emerald-400",
  3: "border-sky-400",
  4: "border-purple-400",
  5: "border-yellow-400",
};

const TIER_TEXT: Record<number, string> = {
  1: "text-neutral-400",
  2: "text-emerald-400",
  3: "text-sky-400",
  4: "text-violet-400",
  5: "text-amber-300",
};

const ItemTile = ({
  name,
  img,
  tier,
  size = "default",
  qty,
  tooltipImg,
  tooltipContent,
  tooltipWidthClass = "min-w-48 w-max",
  className = "",
  portalTooltip = true,
}: ItemTileProps) => {
  const boxSize = size === "small" ? "h-12 w-12" : "h-16 w-16";
  const badgePadding = size === "small" ? "px-1 py-0" : "px-1.5 py-0.5";
  const badgeText = size === "small" ? "text-base" : "text-lg";
  const borderClass = TIER_BORDER[tier] ?? "border-neutral-400";
  const textClass = TIER_TEXT[tier] ?? "text-neutral-300";

  const hasTooltip = !!tooltipContent;
  const tooltipId = useId();
  const anchorRef = useRef<HTMLDivElement | null>(null);
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
    <div
      className={["relative inline-block group", className].join(" ")}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
      ref={anchorRef}
      onMouseEnter={() => hasTooltip && setOpen(true)}
      onMouseLeave={() => hasTooltip && setOpen(false)}
      onFocus={() => hasTooltip && setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {/* Tile */}
      <div
        className={[
          "relative flex rounded-xl cursor-pointer shadow-lg shadow-neutral-500/25",
          boxSize,
          "border-2",
          borderClass,
        ].join(" ")}
        aria-label={qty && qty > 1 ? `${name} × ${qty}` : name}
        title={qty && qty > 1 ? `${name} × ${qty}` : name}
      >
        {img ? (
          <img
            src={img}
            alt={name || "Item"}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : null}

        {qty !== undefined && qty > 1 && (
          <span
            className={[
              "absolute bottom-0 right-0 rounded-xl font-semibold text-neutral-100",
              badgePadding,
              badgeText,
            ].join(" ")}
          >
            {qty}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {hasTooltip && (
        <>
          {/* Non-portal fallback (same as before, but with a strong z-index) */}
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

          {/* Portal (bullet-proof over everything) */}
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
    </div>
  );
};

export default ItemTile;
