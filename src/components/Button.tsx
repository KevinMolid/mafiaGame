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
          ? "bg-neutral-600 px-2 py-1 hover:bg-neutral-700 text-white font-medium"
          : "bg-sky-600 px-2 py-1 hover:bg-sky-700 text-white font-medium"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
