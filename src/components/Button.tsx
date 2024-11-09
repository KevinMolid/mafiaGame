import { ReactNode } from "react";

interface ButtonInterface {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  style?: "primary" | "secondary" | "help" | "helpActive" | "danger" | "exit";
  size?: "small" | "normal" | "square";
}

const Button = ({
  children,
  onClick,
  type = "button",
  style = "primary",
  size = "normal",
}: ButtonInterface) => {
  return (
    <button
      type={type}
      className={
        "text-white font-medium rounded-full " +
        (size === "small"
          ? "px-2 py-1 min-w-16 "
          : size === "square"
          ? "w-10 h-10 "
          : "px-4 py-2 min-w-32 ") +
        (style === "secondary"
          ? "bg-neutral-600 hover:bg-neutral-700 "
          : style === "help"
          ? "bg-neutral-900 border-2 border-neutral-600 hover:border-neutral-500 text-neutral-500 hover:text-neutral-400"
          : style === "helpActive"
          ? "bg-neutral-900 border-2 border-yellow-400 text-yellow-400 hover:bg-neutral-950 "
          : style === "exit"
          ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-neutral-400"
          : style === "danger"
          ? "bg-red-700 hover:bg-red-800"
          : "bg-sky-600 hover:bg-sky-700")
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
