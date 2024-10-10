import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkProps {
  to: string;
  icon: string;
  children: ReactNode;
}

const SidebarLink = ({ to, icon, children }: LinkProps) => {
  return (
    <Link to={to}>
      <h2 className="uppercase text-xs pb-1 text-stone-400 hover:text-stone-200">
        <i className={`fa-solid fa-${icon}`}></i> {children}
      </h2>
    </Link>
  );
};

export default SidebarLink;
