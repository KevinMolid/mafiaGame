// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Button from "../components/Button";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

const statusLabel = (status?: string) => {
  switch ((status ?? "").toLowerCase()) {
    case "alive":
      return "Levende";
    case "dead":
      return "Død";
    default:
      return status ?? "Ukjent";
  }
};

const SelectCharacter = () => {
  const { userData } = useAuth();
  const { userCharacter, setUserCharacter } = useCharacter();
  const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (userData.characters) {
        const characterPromises = userData.characters.map(
          async (characterId: string) => {
            const characterRef = doc(db, "Characters", characterId);
            const characterSnap = await getDoc(characterRef);
            return { id: characterSnap.id, ...characterSnap.data() };
          }
        );

        const characterData = await Promise.all(characterPromises);
        setAvailableCharacters(characterData);
      }
    };

    fetchCharacters();
  }, [userData.characters]);

  const handleSelectCharacter = async (characterId: string) => {
    try {
      // Update active character in the user's document
      const userDocRef = doc(db, "Users", userData.uid);
      await updateDoc(userDocRef, {
        activeCharacter: characterId,
      });

      // Find the selected character from availableCharacters
      const selectedCharacterData = availableCharacters.find(
        (char) => char.id === characterId
      );

      if (selectedCharacterData) {
        // Set the selected character in state
        setUserCharacter({
          ...selectedCharacterData,
        });
      }
    } catch (error) {
      console.error("Error setting active character: ", error);
    }
  };

  return (
    <Main>
      <H1>Select Character</H1>
      <div className="flex gap-4 flex-wrap">
        {availableCharacters.length === 0 ? (
          <p>You have no characters.</p>
        ) : (
          availableCharacters.map((availableCharacter) => {
            const status = String(availableCharacter.status || "");
            const statusClass =
              status.toLowerCase() === "alive"
                ? "text-green-500"
                : status.toLowerCase() === "dead"
                ? "text-red-500"
                : "text-neutral-300";

            return (
              <div
                key={availableCharacter.id}
                className={
                  "flex flex-col border min-w-44 " +
                  (userCharacter?.id !== availableCharacter.id
                    ? "bg-neutral-800 border-neutral-600 px-4 py-2 rounded-lg"
                    : "border-neutral-400 px-4 py-2 rounded-lg")
                }
              >
                <p>
                  <strong className="text-white">
                    {availableCharacter.username}
                  </strong>
                </p>
                <div className="flex flex-col mb-2">
                  <p>
                    Status:{" "}
                    <span className={statusClass}>
                      {statusLabel(availableCharacter.status)}
                    </span>
                  </p>
                  <p>Lokasjon: {availableCharacter.location}</p>
                  <p>
                    Penger: ${availableCharacter.stats.money.toLocaleString()}
                  </p>
                </div>
                {userCharacter?.id !== availableCharacter.id ? (
                  <Button
                    onClick={() => handleSelectCharacter(availableCharacter.id)}
                  >
                    Sett som aktiv
                  </Button>
                ) : (
                  <Button disabled={true}>Aktiv</Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </Main>
  );
};

export default SelectCharacter;
