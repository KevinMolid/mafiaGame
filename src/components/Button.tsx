import { ReactNode } from "react";

interface ButtonInterface {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  style?: "primary" | "secondary";
}

const Button = ({
  children,
  onClick,
  type = "button",
  style = "primary",
}: ButtonInterface) => {
  return (
    <button
      type={type}
      className={
        style === "secondary"
          ? "bg-neutral-500/90 px-2 py-1 hover:bg-neutral-600 text-neutral-900 text-lg font-bold"
          : "bg-yellow-400/90 px-2 py-1 hover:bg-yellow-500/90 text-neutral-900 text-lg font-bold"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
