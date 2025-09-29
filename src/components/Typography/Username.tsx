import { Link } from "react-router-dom";
import AdminList from "../../AdminList";
import { useCharacter } from "../../CharacterContext";

type UsernameProps = {
  character: { id: string; username: string };
  /** If true, do not force white; let it inherit parent color */
  useParentColor?: boolean;
  /** Extra classes for the username text (appended last, can override color) */
  className?: string;
};

const Username = ({ character, useParentColor = false, className }: UsernameProps) => {
  const { userCharacter } = useCharacter();

  const friendIDs = userCharacter?.friends?.map((f: any) => f.id);
  const blacklistIDs = userCharacter?.blacklist?.map((p: any) => p.id);
  const isAdmin = AdminList.some((admin) => admin.id === character.id);

  const nameClasses = [
    "hover:underline",
    useParentColor ? "" : isAdmin ? "text-sky-400" : "text-white",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to={`/profil/${character.id}`}>
      {isAdmin ? (
        <span className="text-sky-400">
          <i className="fa-solid fa-gear"></i>{" "}
        </span>
      ) : userCharacter && character.id === userCharacter.id ? (
        <span className="text-sky-400">
          <i className="fa-solid fa-user"></i>{" "}
        </span>
      ) : userCharacter && friendIDs?.includes(character.id) ? (
        <span className="text-green-400">
          <i className="fa-solid fa-user"></i>{" "}
        </span>
      ) : userCharacter && blacklistIDs?.includes(character.id) ? (
        <span className="text-red-400">
          <i className="fa-solid fa-skull-crossbones"></i>{" "}
        </span>
      ) : (
        <span />
      )}
      <strong className={nameClasses}>{character.username}</strong>
    </Link>
  );
};

export default Username;
