import { ReactNode } from "react";

import Box from "./Box";

interface AlertInterface {
  children: ReactNode;
  read: boolean;
}

const Alert = ({ children, read }: AlertInterface) => {
  return (
    <Box>
      <div className={`flex justify-between  ${read ? "" : "bg-neutral-800"}`}>
        {children}
      </div>
    </Box>
  );
};

export default Alert;
