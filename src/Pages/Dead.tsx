import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

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
    <Main img="dead">
      <div className="relative w-5/6 sm:w-2/3 max-w-[500px] flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <div className="bg-neutral-900/80 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <H1>Du har blitt drept!</H1>
          <p>
            Din bruker <Username character={character} /> ble drept{" "}
            {formattedDate || "på et ukjent tidspunkt"}.
          </p>
          <Button>Oprett ny bruker</Button>
        </div>
      </div>
    </Main>
  );
};

export default Dead;
