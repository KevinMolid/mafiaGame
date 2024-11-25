import { Link } from "react-router-dom";

import { useCharacter } from "../../CharacterContext";

const Username = ({ character }: any) => {
  const { userCharacter } = useCharacter();
  console.log(userCharacter);

  return (
    <Link to={`/profil/${character.id}`}>
      <strong className="text-white hover:underline">
        {character.username}
      </strong>
    </Link>
  );
};

export default Username;
