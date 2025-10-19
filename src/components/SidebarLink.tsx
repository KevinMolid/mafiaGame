import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface LinkProps {
  to?: string;
  icon: string; // can include extra classes like "comment-dots fa-bounce text-sky-400"
  color?: "yellow" | "sky"; // add sky support
  children: ReactNode;
  onClick?: () => void;
  exact?: boolean; // exact match for "/"
}

const baseRow =
  "grid grid-cols-[24px_auto] px-4 py-1 transition-colors border-l-2";
const textClasses = (color?: "yellow" | "sky", active?: boolean) => {
  if (color === "yellow") {
    return active
      ? " text-yellow-300 border-l-yellow-400"
      : " text-yellow-400 hover:text-yellow-300 border-l-transparent";
  }
  if (color === "sky") {
    return active
      ? " text-sky-300 border-l-sky-400"
      : " text-sky-400 hover:text-sky-300 border-l-transparent";
  }
  return active
    ? " text-stone-200 border-l-sky-400"
    : " text-stone-400 hover:text-stone-200 border-l-transparent";
};

const SidebarLink = ({
  to,
  icon,
  children,
  color,
  onClick,
  exact,
}: LinkProps) => {
  // BUTTON (no navigation)
  if (!to) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseRow} hover:bg-neutral-800 ${textClasses(
          color,
          false
        )} w-full text-left`}
      >
        <div>
          <i className={`fa-solid fa-${icon}`} />
        </div>
        <div className="grid grid-cols-[auto_max-content]">{children}</div>
      </button>
    );
  }

  // NAVLINK (navigation + active styles)
  return (
    <NavLink
      to={to}
      end={!!exact}
      className={({ isActive }) => {
        const bg = isActive ? " bg-neutral-800" : " hover:bg-neutral-800";
        return `${baseRow}${bg} ${textClasses(color, isActive)}`;
      }}
    >
      <div>
        <i className={`fa-solid fa-${icon}`} />
      </div>
      <div className="grid grid-cols-[auto_max-content]">{children}</div>
    </NavLink>
  );
};

export default SidebarLink;
