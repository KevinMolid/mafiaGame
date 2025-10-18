import { ReactNode } from "react";
import { useAuth } from "../AuthContext";
import { useLocation } from "react-router-dom";

interface ContentInterface {
  children: ReactNode;
}

const ContentWrap = ({ children }: ContentInterface) => {
  const { userData } = useAuth();
  const { pathname } = useLocation();

  const showBackground =
    (!userData && pathname === "/logginn") ||
    pathname === "/registrer" ||
    pathname === "/glemtpassord";

  return (
    <div
      id="content-wrap"
      className="flex flex-col flex-grow relative bg-neutral-900"
      style={
        showBackground
          ? {
              backgroundImage: `url('/Mafia.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default ContentWrap;
