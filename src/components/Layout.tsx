import { ReactNode } from "react";
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

interface LayoutInterface {
  children: ReactNode;
}

const Layout = ({ children }: LayoutInterface) => {
  const { userData } = useAuth();
  const { character } = useCharacter();

  if (userData && character) {
    return (
      <div className="flex flex-col sm:grid sm:grid-cols-[220px_auto] flex-grow">
        {children}
      </div>
    );
  }
  if (!userData || !character) {
    return <div className="flex flex-grow">{children}</div>;
  }
};

export default Layout;
