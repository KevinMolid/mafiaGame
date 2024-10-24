import { ReactNode } from "react";

import Box from "./Box";

interface AlertInterface {
  children: ReactNode;
  read: boolean;
}

const Alert = ({ children, read }: AlertInterface) => {
  return (
    <div className={`${read ? "" : "bg-neutral-800"}`}>
      <Box>
        <div className={`flex justify-between `}>{children}</div>
      </Box>
    </div>
  );
};

export default Alert;
