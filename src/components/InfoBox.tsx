import { ReactNode } from "react";

interface InfoBoxInterface {
  children: ReactNode;
  type: "success" | "failure" | "important" | "warning" | "info";
  className?: string;
}

const BAR_CLASS: Record<InfoBoxInterface["type"], string> = {
  success: "bg-green-400/80",
  failure: "bg-red-400/80",
  important: "bg-blue-400/80",
  warning: "bg-amber-400/80",
  info: "bg-sky-400/80",
};

// matching text color for the icon
const ICON_COLOR: Record<InfoBoxInterface["type"], string> = {
  success: "text-green-400/80",
  failure: "text-red-400/80",
  important: "text-blue-400/80",
  warning: "text-amber-400/80",
  info: "text-sky-400/80",
};

// icon glyphs (Font Awesome)
const ICON_GLYPH: Record<InfoBoxInterface["type"], string> = {
  success: "fa-thumbs-up",
  failure: "fa-thumbs-down",
  important: "fa-circle-exclamation",
  warning: "fa-circle-exclamation",
  info: "fa-circle-info",
};

const InfoBox = ({ children, type, className = "" }: InfoBoxInterface) => {
  const bar = BAR_CLASS[type];
  const iconColor = ICON_COLOR[type];
  const icon = ICON_GLYPH[type];

  return (
    <div
      className={[
        "relative mb-6 rounded-2xl",
        "bg-neutral-800 backdrop-blur-sm border border-neutral-600",
        "px-4 py-2 pl-6 pr-10 text-neutral-200",
        className,
      ].join(" ")}
      role="status"
      aria-live={
        type === "failure" || type === "warning" ? "assertive" : "polite"
      }
    >
      {/* Left solid bar */}
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute left-0 top-0 h-full w-4 rounded-l-2xl",
          bar,
          "-z-10",
        ].join(" ")}
      />

      {/* Right-side icon */}
      <span
        aria-hidden
        className={[
          "absolute right-3 top-1/2 -translate-y-1/2",
          "text-2xl", // icon size
          iconColor,
        ].join(" ")}
      >
        <i className={`fa-solid ${icon}`} />
      </span>

      {/* Content */}
      <div className="relative z-10 ml-1 leading-relaxed">{children}</div>
    </div>
  );
};

export default InfoBox;
