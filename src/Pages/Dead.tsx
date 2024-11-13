import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

import { getCurrentRank } from "../Functions/RankFunctions";

import { Link } from "react-router-dom";

import { useCharacter } from "../CharacterContext";

const Dead = () => {
  const { character } = useCharacter();

  if (!character) return;

  let formattedDate = "";

  if (character.diedAt) {
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
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(diedAtDate);
    }
  }

  return (
    <Main img="dead">
      <div className="text-center relative w-5/6 sm:w-2/3 max-w-[500px] flex flex-col top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <div className="bg-neutral-900/80 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <H1>Du har blitt drept!</H1>
          <Link to={`/profil/${character.id}`}>
            <img
              className="border border-neutral-500 w-[160px] h-[160px] object-cover m-auto hover:cursor-pointer"
              src={character.img || "/default.jpg"}
              alt="Profile picture"
            />
          </Link>
          <div className="text-center text-stone-400">
            <Username character={character} />
            <p>{getCurrentRank(character.stats.xp)}</p>
          </div>
          <p className="mb-2">
            Din spillkarakter ble drept{" "}
            <span className="text-neutral-200">
              {formattedDate || "på et ukjent tidspunkt"}
            </span>
            .
          </p>
          <Link to="/nyspiller">
            <Button>Oprett ny karakter</Button>
          </Link>
        </div>
      </div>
    </Main>
  );
};

export default Dead;
