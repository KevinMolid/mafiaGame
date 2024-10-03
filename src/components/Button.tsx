import { ReactNode } from "react";

interface ButtonInterface {
  children: ReactNode;
  onClick: () => void;
}

const Button = ({ children, onClick }: ButtonInterface) => {
  return (
    <button
      className="bg-sky-800 px-4 py-2 hover:bg-sky-900 text-neutral-200"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
