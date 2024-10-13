import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkProps {
  to: string;
  icon: string;
  children: ReactNode;
  onClick?: () => void;
}

const SidebarLink = ({ to, icon, children, onClick }: LinkProps) => {
  return (
    <Link to={to} onClick={onClick}>
      <div className="text-stone-400 hover:text-stone-200 grid grid-cols-[24px_auto]">
        <div>
          <i className={`fa-solid fa-${icon}`}></i>
        </div>
        <div>
          <p>{children}</p>
        </div>
      </div>
    </Link>
  );
};

export default SidebarLink;
