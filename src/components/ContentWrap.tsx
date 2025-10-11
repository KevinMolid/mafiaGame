import { ReactNode } from "react";
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

interface ContentInterface {
  children: ReactNode;
}

const ContentWrap = ({ children }: ContentInterface) => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();

  if (userData && userCharacter) {
    return (
      <div className="flex flex-col flex-grow relative bg-neutral-900">
        {children}
      </div>
    );
  }
  if (!userData || !userCharacter) {
    return (
      <div
        id="content-wrap"
        className="flex flex-col flex-grow relative bg-neutral-900"
        style={{
          backgroundImage: `url('/Mafia.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundPositionY: "top",
        }}
      >
        {children}
      </div>
    );
  }
};

export default ContentWrap;
