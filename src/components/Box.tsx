import { ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
  type?: string;
  className?: string;
}

const Box = ({ children, type = "normal", className }: BoxProps) => {
  return (
    <div
      className={
        `border px-2 py-4 sm:p-4 ${className} ` +
        (type === "help"
          ? "border-yellow-400 bg-neutral-900"
          : "border-neutral-500")
      }
    >
      {children}
    </div>
  );
};

export default Box;
