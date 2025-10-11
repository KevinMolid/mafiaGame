import { ReactNode } from "react";
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";
import NewsBar from "./News/NewsBar";

interface LayoutInterface {
  children: ReactNode;
}

const Layout = ({ children }: LayoutInterface) => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();

  if (userData && userCharacter && userCharacter.status === "alive") {
    return (
      <div className="flex flex-col flex-grow max-w-[1440px] w-full relative">
        <NewsBar />
        <div className="flex flex-col lg:grid md:grid-cols-[220px_auto] xl:grid-cols-[220px_auto_220px] flex-grow ">
          {children}
        </div>
      </div>
    );
  }
  if (!userData || !userCharacter || userCharacter.status === "dead") {
    return (
      <div className="flex flex-grow max-w-[1000px] w-full relative">
        {children}
      </div>
    );
  }
};

export default Layout;
