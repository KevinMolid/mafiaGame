import { ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
}

const Box = ({ children }: BoxProps) => {
  return <div className="border border-neutral-500 p-4">{children}</div>;
};

export default Box;
