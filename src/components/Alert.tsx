import { ReactNode } from "react";

interface AlertInterface {
  children: ReactNode;
  read: boolean;
}

const Alert = ({ children, read }: AlertInterface) => {
  return (
    <div
      className={`${
        read
          ? "bg-neutral-900 border border-neutral-700"
          : "bg-neutral-950 border border-neutral-500"
      }`}
    >
      <div
        className={`grid grid-cols-[1fr_auto] gap-4 my-1 mx-2 md:my-2 md:mx-4`}
      >
        {children}
      </div>
    </div>
  );
};

export default Alert;
