import { ReactNode } from "react";

interface H1Interface {
  children: ReactNode;
}

const H1 = ({ children }: H1Interface) => {
  return <h1 className="text-4xl mb-6 text-white">{children}</h1>;
};

export default H1;
