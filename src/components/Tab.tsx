import { ReactNode } from "react";

interface TabInterface {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

const Tab = ({ active, onClick, children }: TabInterface) => {
  return (
    <li
      className={
        " hover:bg-neutral-800 px-2 py-2 border-b-2 border-neutral-700 cursor-pointer flex-grow " +
        (active && "bg-neutral-800 border-white")
      }
      onClick={onClick}
    >
      <div className="text-neutral-200 text-sm lg:text-base font-medium text-center">
        {children}
      </div>
    </li>
  );
};

export default Tab;
