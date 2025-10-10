import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkProps {
  to?: string;
  icon: string;
  color?: string;
  children: ReactNode;
  onClick?: () => void;
}

const SidebarLink = ({ to, icon, children, color, onClick }: LinkProps) => {
  return (
    <Link to={to || "#"} onClick={onClick}>
      <div
        className={
          color === "yellow"
            ? "text-yellow-400 hover:text-yellow-300 grid grid-cols-[24px_auto]"
            : "text-stone-400 hover:text-stone-200 grid grid-cols-[24px_auto]"
        }
      >
        <div>
          <i className={`fa-solid fa-${icon}`}></i>
        </div>
        <div className="grid grid-cols-[auto_max-content]">{children}</div>
      </div>
    </Link>
  );
};

export default SidebarLink;
