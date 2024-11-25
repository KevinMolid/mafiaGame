import { ReactNode } from "react";
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

interface LayoutInterface {
  children: ReactNode;
}

const Layout = ({ children }: LayoutInterface) => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();

  if (userData && userCharacter && userCharacter.status === "alive") {
    return (
      <div className="flex flex-col sm:grid sm:grid-cols-[220px_auto] flex-grow">
        {children}
      </div>
    );
  }
  if (!userData || !userCharacter || userCharacter.status === "dead") {
    return <div className="flex flex-grow">{children}</div>;
  }
};

export default Layout;
