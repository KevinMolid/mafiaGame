import Main from "../components/Main";
import H1 from "../components/Typography/H1";

import { useCharacter } from "../CharacterContext";

const Dead = () => {
  const { character } = useCharacter();

  let formattedDate = "";

  if (character?.diedAt) {
    let diedAtDate;

    // Check if diedAt is a Timestamp or already a Date
    if (typeof character.diedAt.toDate === "function") {
      diedAtDate = character.diedAt.toDate(); // Firebase Timestamp
    } else if (character.diedAt instanceof Date) {
      diedAtDate = character.diedAt; // Already a Date
    } else if (typeof character.diedAt === "number") {
      diedAtDate = new Date(character.diedAt); // Milliseconds
    }

    if (diedAtDate) {
      formattedDate = new Intl.DateTimeFormat("no-NO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(diedAtDate);
    }
  }

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
