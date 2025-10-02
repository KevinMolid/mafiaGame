// Label.tsx
type LabelType =
  | "pinned"
  | "closed"
  | "info"
  | "success"
  | "warning"
  | "danger";

type LabelProps = {
  type: LabelType;
  className?: string; // extra classes if you need spacing tweaks
  size?: "sm" | "md" | "lg";
};

const CONFIG: Record<
  LabelType,
  { bg: string; text: string; icon: string; aria: string; title: string }
> = {
  pinned: {
    bg: "bg-amber-200",
    text: "text-amber-900/90",
    icon: "fa-thumbtack",
    aria: "Festet tråd",
    title: "Festet",
  },
  closed: {
    bg: "bg-red-200",
    text: "text-red-900/90",
    icon: "fa-lock",
    aria: "Stengt tråd",
    title: "Stengt",
  },
  info: {
    bg: "bg-sky-200",
    text: "text-sky-900/90",
    icon: "fa-circle-info",
    aria: "Info",
    title: "Info",
  },
  success: {
    bg: "bg-green-200",
    text: "text-green-900/90",
    icon: "fa-check",
    aria: "Vellykket",
    title: "Vellykket",
  },
  warning: {
    bg: "bg-yellow-200",
    text: "text-yellow-900/90",
    icon: "fa-triangle-exclamation",
    aria: "Advarsel",
    title: "Advarsel",
  },
  danger: {
    bg: "bg-rose-200",
    text: "text-rose-900/90",
    icon: "fa-circle-xmark",
    aria: "Feil",
    title: "Feil",
  },
};

const SIZE: Record<NonNullable<LabelProps["size"]>, string> = {
  sm: "w-4 h-4 text-[10px]",
  md: "w-5 h-5 text-[12px]",
  lg: "w-6 h-6 text-[14px]",
};

const Label = ({ type, className = "", size = "md" }: LabelProps) => {
  const cfg = CONFIG[type];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-sm ${cfg.bg} ${cfg.text} ${SIZE[size]} ${className}`}
      role="img"
      aria-label={cfg.aria}
      title={cfg.title}
    >
      <i className={`fa-solid ${cfg.icon}`} />
    </div>
  );
};

export default Label;
