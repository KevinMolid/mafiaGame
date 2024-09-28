import { ReactNode } from "react";

interface H2Interface {
  children: ReactNode;
}

const H2 = ({ children }: H2Interface) => {
  return <h2 className="text-3xl mb-4 text-white">{children}</h2>;
};

export default H2;
