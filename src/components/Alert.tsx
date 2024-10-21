import { ReactNode } from "react";

interface AlertInterface {
  children: ReactNode;
  read: boolean;
}

const Alert = ({ children, read }: AlertInterface) => {
  return (
    <div
      className={`flex justify-between py-2 px-4 mb-2 border border-neutral-700 ${
        read ? "" : "bg-neutral-950 border-neutral-600"
      }`}
    >
      {children}
    </div>
  );
};

export default Alert;
