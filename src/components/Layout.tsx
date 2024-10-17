import { ReactNode } from "react";
import { useAuth } from "../AuthContext";

interface LayoutInterface {
  children: ReactNode;
}

const Layout = ({ children }: LayoutInterface) => {
  const { userData } = useAuth();

  if (userData) {
    return (
      <div className="flex flex-col sm:grid sm:grid-cols-[220px_auto] flex-grow">
        {children}
      </div>
    );
  }
  if (!userData) {
    return <div className="flex flex-grow">{children}</div>;
  }
};

export default Layout;
