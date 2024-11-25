import { Link } from "react-router-dom";

import { useCharacter } from "../../CharacterContext";

const Username = ({ character }: any) => {
  const { userCharacter } = useCharacter();

  const friendIDs = userCharacter?.friends?.map((friend: any) => {
    return friend.id;
  });

  const blacklistIDs = userCharacter?.blacklist?.map((player: any) => {
    return player.id;
  });

  return (
    <Link to={`/profil/${character.id}`}>
      {userCharacter && character.id === userCharacter.id && (
        <span className="text-sky-400">
          <i className="fa-solid fa-user"></i>{" "}
        </span>
      )}
      {userCharacter && friendIDs.includes(character.id) && (
        <span className="text-green-400">
          <i className="fa-solid fa-user"></i>{" "}
        </span>
      )}
      {userCharacter && blacklistIDs.includes(character.id) && (
        <span className="text-red-400">
          <i className="fa-solid fa-skull-crossbones"></i>{" "}
        </span>
      )}
      <strong className="text-white hover:underline">
        {character.username}
      </strong>
    </Link>
  );
};

export default Username;
