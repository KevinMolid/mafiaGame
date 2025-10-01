import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkProps {
  to?: string;
  icon?: string;
  color?: string;
  children: ReactNode;
  onClick?: () => void;
}

const DropdownOption = ({ to, icon, children, color, onClick }: LinkProps) => {
  return (
    <Link to={to || "#"} onClick={onClick}>
      <div
        className={
          "grid grid-cols-[20px_auto] hover:bg-neutral-900 px-4 py-2 gap-2 " +
          (color === "yellow"
            ? "text-yellow-400 hover:text-yellow-300"
            : color === "sky"
            ? "text-sky-400 hover:text-sky-300"
            : "text-stone-400 hover:text-stone-200")
        }
      >
        <div className="text-center">
          <i className={`fa-solid fa-${icon}`}></i>
        </div>
        <div className="grid grid-cols-[auto_max-content]">{children}</div>
      </div>
    </Link>
  );
};

export default DropdownOption;
