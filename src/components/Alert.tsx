import { ReactNode } from "react";

interface AlertInterface {
  children: ReactNode;
  read: boolean;
}

const Alert = ({ children, read }: AlertInterface) => {
  return (
    <div
      className={`flex justify-between py-2 px-4 mb-2 border  ${
        read ? "border-neutral-800" : "bg-neutral-800 border-neutral-600"
      }`}
    >
      {children}
    </div>
  );
};

export default Alert;
