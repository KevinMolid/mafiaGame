// CharacterList.tsx
import { FC } from "react";
import { Character } from "../Interfaces/CharacterTypes";

interface CharacterListProps {
  characters: Character[];
  renderCharacter: (character: Character) => React.ReactNode; // Function to render each character
}

const CharacterList: FC<CharacterListProps> = ({
  characters,
  renderCharacter,
}) => {
  if (!characters || characters.length === 0) {
    return <div>No characters found.</div>;
  }

  return (
    <ul className="character-list">
      {characters.map((character) => (
        <li key={character.id} className="character-item">
          {renderCharacter(character)}
        </li>
      ))}
    </ul>
  );
};

export default CharacterList;
