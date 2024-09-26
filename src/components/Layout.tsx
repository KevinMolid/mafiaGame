import { ReactNode } from "react";

interface LayoutInterface {
  children: ReactNode;
}

const Layout = ({ children }: LayoutInterface) => {
  return <main className="grid grid-cols-[220px_auto]">{children}</main>;
};

export default Layout;
