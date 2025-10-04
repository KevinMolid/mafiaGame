import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCharacter } from "../../CharacterContext";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

type UsernameProps = {
  character: { id: string; username: string; role?: string }; // role optional; used as initial/fallback
  /** If true, do not force white; let it inherit parent color */
  useParentColor?: boolean;
  /** Extra classes for the username text (appended last, can override color) */
  className?: string;
};

const Username = ({
  character,
  useParentColor = false,
  className,
}: UsernameProps) => {
  const { userCharacter } = useCharacter();

  // Live role from DB (seed with prop.role to avoid flicker)
  const [role, setRole] = useState<string | undefined>(character.role);

  useEffect(() => {
    if (!character.id) return;
    const db = getFirestore();
    const ref = doc(db, "Characters", character.id);
    const unsub = onSnapshot(
      ref,
      (snap) => setRole((snap.data() as any)?.role),
      () => setRole(character.role) // fallback to prop on error
    );
    return unsub;
  }, [character.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const friendIDs = userCharacter?.friends?.map((f: any) => f.id);
  const blacklistIDs = userCharacter?.blacklist?.map((p: any) => p.id);

  const isAdmin =
    role === "admin" ||
    (userCharacter?.id === character.id && userCharacter?.role === "admin");

  const isModerator =
    role === "moderator" ||
    (userCharacter?.id === character.id && userCharacter?.role === "moderator");

  const nameClasses = [
    "hover:underline",
    useParentColor
      ? ""
      : isAdmin
      ? "text-sky-400"
      : isModerator
      ? "text-green-400"
      : "text-white",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const prefixIcon = isAdmin ? (
    <span className="text-sky-400">
      <i className="fa-solid fa-gear"></i>{" "}
    </span>
  ) : isModerator ? (
    <span className="text-green-400">
      <i className="fa-solid fa-shield"></i>{" "}
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
  );

  return (
    <Link to={`/profil/${character.id}`}>
      {prefixIcon}
      <strong className={nameClasses}>{character.username}</strong>
    </Link>
  );
};

export default Username;
