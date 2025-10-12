import React, { useId } from "react";

type ItemProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  tier?: number;
  tooltipImg?: string;
  tooltipContent?: React.ReactNode; // text, JSX, list of stats, etc.
  tooltipWidthClass?: string; // e.g. "w-72" (optional)
};

const TIER_CLASSES: Record<number, string> = {
  1: "neutral-400",
  2: "emerald-400",
  3: "sky-400",
  4: "violet-400",
  5: "amber-300",
};

const Item = ({
  name,
  tier = 1,
  className = "",
  tooltipImg,
  tooltipContent,
  tooltipWidthClass = "min-w-72 w-max-content",
  ...rest
}: ItemProps) => {
  const color = TIER_CLASSES[tier] ?? "neutral-300";
  const hasTooltip = !!tooltipContent;
  const tooltipId = useId();

  return (
    <span
      className={`relative inline-flex items-center font-bold group text-${color} ${className} cursor-pointer text-nowrap`}
      // make focusable for keyboard users if it has a tooltip
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
      {...rest}
    >
      {name}

      {hasTooltip && (
        <>
          {/* Tooltip */}
          <span
            id={tooltipId}
            role="tooltip"
            className={[
              "pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2",
              "rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-xl",
              "px-4 py-3 text-sm text-left",
              tooltipWidthClass,
              // show on hover AND keyboard focus
              "opacity-0 scale-95 transition-all duration-150 ease-out",
              "group-hover:opacity-100 group-hover:scale-100",
              "group-focus-within:opacity-100 group-focus-within:scale-100",
            ].join(" ")}
          >
            {tooltipContent && (
              <article className="text-stone-400 leading-snug flex gap-2">
                <img
                  src={tooltipImg}
                  alt=""
                  className={`w-24 h-16 object-cover border-2 border-${color} rounded-xl`}
                />
                <section>
                  <span
                    className={`relative inline-flex items-center font-bold group text-${color} ${className}`}
                  >
                    {name}
                  </span>
                  <div className="font-normal">{tooltipContent}</div>
                </section>
              </article>
            )}

            {/* caret */}
            <span
              aria-hidden
              className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-45
                         h-3 w-3 border-l border-t border-neutral-700 bg-neutral-900"
            />
          </span>
        </>
      )}
    </span>
  );
};

export default Item;
