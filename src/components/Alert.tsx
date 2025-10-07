import { ReactNode } from "react";

interface AlertInterface {
  children: ReactNode;
  read: boolean;
}

const Alert = ({ children, read }: AlertInterface) => {
  return (
    <div
      className={
        "flex flex-col justify-center h-8 border border-neutral-700 " +
        `${
          read
            ? "bg-neutral-900/50 border-neutral-700"
            : "bg-neutral-950/50 border-neutral-600"
        }`
      }
    >
      <div className={`grid grid-cols-[1fr_auto] gap-4 mx-2 md:mx-4`}>
        {children}
      </div>
    </div>
  );
};

export default Alert;
