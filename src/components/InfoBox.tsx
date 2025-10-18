import { ReactNode } from "react";
import Button from "./Button";

interface InfoBoxInterface {
  children: ReactNode;
  type: "success" | "failure" | "important" | "warning" | "info";
  className?: string;
}

const ICON_CLASS: Record<InfoBoxInterface["type"], string> = {
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
  const iconColor = ICON_CLASS[type];
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
          "pointer-events-none absolute left-0 top-0 h-full w-10 rounded-l-2xl",
          "bg-neutral-700",
          "-z-10",
        ].join(" ")}
      />

      {/* Left-side icon */}
      <span
        aria-hidden
        className={[
          "absolute left-3 top-1/2 -translate-y-1/2",
          "text-xl",
          iconColor,
        ].join(" ")}
      >
        <i className={`fa-solid ${icon}`} />
      </span>

      {/* Right-side icon */}
      <span className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button size="small-square" style="exit">
          <i className={`fa-solid fa-x`} />
        </Button>
      </span>

      {/* Content */}
      <div className="relative z-10 ml-6 leading-relaxed">{children}</div>
    </div>
  );
};

export default InfoBox;
