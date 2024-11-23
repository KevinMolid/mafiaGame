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
        " hover:bg-neutral-800 px-4 py-2 max-w-44 border-b-2 border-neutral-700 cursor-pointer " +
        (active && "bg-neutral-800 border-white")
      }
      onClick={onClick}
    >
      <p className="text-neutral-200 font-medium">{children}</p>
    </li>
  );
};

export default Tab;
