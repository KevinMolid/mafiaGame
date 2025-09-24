import { ReactNode } from "react";

interface ButtonInterface {
  children: ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>; // <-- accept event
  type?: "button" | "submit" | "reset";
  style?:
    | "primary"
    | "secondary"
    | "black"
    | "help"
    | "helpActive"
    | "danger"
    | "realistic"
    | "exit";
  size?: "small" | "normal" | "square";
  disabled?: boolean;
}

const Button = ({
  children,
  onClick,
  type = "button",
  style = "primary",
  size = "normal",
  disabled = false,
}: ButtonInterface) => {
  const sizeClasses =
    size === "small"
      ? "px-4 min-w-16"
      : size === "square"
      ? "w-10 h-10"
      : "px-4 py-1 min-w-32";

  // Base “disabled” overrides: these will apply whenever the element is disabled
  const disabledOverrides =
    "disabled:border-neutral-600 disabled:text-neutral-400 disabled:opacity-90 disabled:hover:border-neutral-600";

  const variantClasses =
    style === "secondary"
      ? "bg-neutral-900 border-2 border-neutral-600 text-neutral-200 hover:border-neutral-700"
      : style === "black"
      ? "bg-neutral-900 border-2 border-neutral-600 text-neutral-200 hover:border-neutral-700"
      : style === "help"
      ? "bg-neutral-900 border-2 border-neutral-600 hover:border-neutral-500 text-neutral-500 hover:text-neutral-400"
      : style === "helpActive"
      ? "bg-neutral-900 border-2 border-yellow-400 text-neutral-200 hover:border-yellow-500"
      : style === "exit"
      ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-neutral-400"
      : style === "danger"
      ? "bg-neutral-900 border-2 border-red-400 text-neutral-200 hover:border-red-500"
      : // primary (default)
        "bg-neutral-900 border-2 border-sky-400 text-neutral-200 hover:border-sky-500";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={[
        "font-medium rounded-full transition-colors",
        sizeClasses,
        variantClasses,
        disabledOverrides,
      ].join(" ")}
    >
      {children}
    </button>
  );
};

export default Button;
