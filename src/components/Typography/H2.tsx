import { ReactNode } from "react";

interface H2Interface {
  children: ReactNode;
}

const H2 = ({ children }: H2Interface) => {
  return (
    <h2 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 md:mb-5 text-white">
      {children}
    </h2>
  );
};

export default H2;
