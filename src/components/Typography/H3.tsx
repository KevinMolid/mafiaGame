import { ReactNode } from "react";

interface H3Interface {
  children: ReactNode;
}

const H3 = ({ children }: H3Interface) => {
  return (
    <h3 className="text-lg sm:text-xl md:text-2xl mb-0 sm:mb-1 md:mb-2 text-slate-200">
      {children}
    </h3>
  );
};

export default H3;
