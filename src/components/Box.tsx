import { ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
  color?: string;
}

const Box = ({ children, color = "neutral" }: BoxProps) => {
  return (
    <div
      className={
        "border rounded-lg px-4 py-2 " +
        (color === "slate"
          ? "bg-slate-800 border-slate-600 text-slate-400"
          : `bg-neutral-800 border-neutral-600 text-neutral-400`)
      }
    >
      {children}
    </div>
  );
};

export default Box;
