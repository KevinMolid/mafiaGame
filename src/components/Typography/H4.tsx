import { ReactNode } from "react";

interface H3Interface {
  children: ReactNode;
}

const H4 = ({ children }: H3Interface) => {
  return (
    <h4 className="text-lg font-medium mb-1 text-neutral-200">{children}</h4>
  );
};

export default H4;
