import Main from "../components/Main";
import H1 from "../components/Typography/H1";

import { useCharacter } from "../CharacterContext";

const Dead = () => {
  const { character } = useCharacter();

  const formattedDate = character?.diedAt
    ? character.diedAt.toLocaleDateString("nb-NO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Main img="dead2">
      <H1>Du har blitt drept!</H1>
      <p>
        Din spiller {character?.username} ble drept{" "}
        {formattedDate || "på et ukjent tidspunkt"}.
      </p>
    </Main>
  );
};

export default Dead;
