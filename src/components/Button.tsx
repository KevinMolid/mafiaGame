import { ReactNode } from "react";

interface ButtonInterface {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  style?: "primary" | "secondary" | "danger";
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
          ? "bg-neutral-600 px-4 py-2 hover:bg-neutral-700 text-white font-medium"
          : style === "danger"
          ? "bg-red-700 px-4 py-2 hover:bg-red-800 text-white font-medium"
          : "bg-sky-600 px-4 py-2 hover:bg-sky-700 text-white font-medium"
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
