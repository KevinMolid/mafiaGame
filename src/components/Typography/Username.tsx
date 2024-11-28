import { Link } from "react-router-dom";
import AdminList from "../../AdminList";

import { useCharacter } from "../../CharacterContext";

const Username = ({ character }: any) => {
  const { userCharacter } = useCharacter();

  const friendIDs = userCharacter?.friends?.map((friend: any) => {
    return friend.id;
  });

  const blacklistIDs = userCharacter?.blacklist?.map((player: any) => {
    return player.id;
  });

  // Check if the character.id exists in AdminList
  const isAdmin = AdminList.some((admin) => admin.id === character.id);

  return (
    <Link to={`/profil/${character.id}`}>
      {isAdmin ? (
        <span className="text-yellow-400">
          <i className="fa-solid fa-chess-king"></i>{" "}
        </span>
      ) : userCharacter && character.id === userCharacter.id ? (
        <span className="text-sky-400">
          <i className="fa-solid fa-user"></i>{" "}
        </span>
      ) : userCharacter && friendIDs && friendIDs.includes(character.id) ? (
        <span className="text-green-400">
          <i className="fa-solid fa-user"></i>{" "}
        </span>
      ) : userCharacter &&
        blacklistIDs &&
        blacklistIDs.includes(character.id) ? (
        <span className="text-red-400">
          <i className="fa-solid fa-skull-crossbones"></i>{" "}
        </span>
      ) : (
        <span></span>
      )}
      <strong className="hover:underline text-white">
        {character.username}
      </strong>
    </Link>
  );
};

export default Username;
