import { ReactNode } from "react";

interface ButtonInterface {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const Button = ({ children, onClick, type = "button" }: ButtonInterface) => {
  return (
    <button
      type={type}
      className="bg-sky-800 px-4 py-2 hover:bg-sky-900 text-neutral-200"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
