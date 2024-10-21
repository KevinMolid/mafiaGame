import { ReactNode } from "react";

interface AlertInterface {
  children: ReactNode;
}

const Alert = ({ children }: AlertInterface) => {
  return (
    <div
      className={`flex justify-between py-2 px-4 mb-2 border border-neutral-600`}
    >
      {children}
    </div>
  );
};

export default Alert;
