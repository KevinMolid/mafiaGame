import { ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
  type?: string;
}

const Box = ({ children, type = "normal" }: BoxProps) => {
  return (
    <div
      className={
        "border p-4 " +
        (type === "help"
          ? "border-yellow-400 bg-neutral-900 text-sm lg:text-base"
          : "border-neutral-500")
      }
    >
      {children}
    </div>
  );
};

export default Box;
