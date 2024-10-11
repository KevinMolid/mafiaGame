import { ReactNode } from "react";

interface LayoutInterface {
  children: ReactNode;
}

const Layout = ({ children }: LayoutInterface) => {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[220px_auto] flex-grow">
      {children}
    </div>
  );
};

export default Layout;
