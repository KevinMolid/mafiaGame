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

const SelectCharacter = () => {
  const { userData } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null
  );

  console.log(userData);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (userData.characters) {
        const characterPromises = userData.characters.map(
          async (characterId: string) => {
            const characterRef = doc(db, "Characters", characterId);
            const characterSnap = await getDoc(characterRef);
            if (characterId === userData.activeCharacter) {
              setSelectedCharacter(characterId);
            }

            return { id: characterSnap.id, ...characterSnap.data() };
          }
        );

        const characterData = await Promise.all(characterPromises);
        setCharacters(characterData);
      }
    };

    fetchCharacters();
  }, [userData.characters]);

  const handleSelectCharacter = async (characterId: string) => {
    // Set the selected character as the active character
    try {
      const userDocRef = doc(db, "Users", userData.uid);
      await updateDoc(userDocRef, {
        activeCharacter: characterId,
      });

      setSelectedCharacter(characterId); // Optionally, reflect the selection in the UI
    } catch (error) {
      console.error("Error setting active character: ", error);
    }
  };

  return (
    <Main>
      <H1>Select Character</H1>
      <div className="flex gap-4 flex-wrap">
        {characters.length === 0 ? (
          <p>You have no characters.</p>
        ) : (
          characters.map((character) => (
            <div
              key={character.id}
              className={
                "flex flex-col border min-w-44 " +
                (selectedCharacter !== character.id
                  ? "bg-neutral-800 border-neutral-600 px-4 py-2 rounded-lg"
                  : "border-neutral-400 px-4 py-2 rounded-lg")
              }
            >
              <p>
                <strong className="text-white">{character.username}</strong>
              </p>
              <div className="flex gap-4 mb-2">
                <p>
                  Status:{" "}
                  <span
                    className={
                      character.status === "alive"
                        ? "text-green-500"
                        : character.status === "dead"
                        ? "text-red-500"
                        : ""
                    }
                  >
                    {character.status[0].toUpperCase() +
                      character.status.slice(1)}
                  </span>
                </p>
              </div>
              {selectedCharacter !== character.id ? (
                <Button onClick={() => handleSelectCharacter(character.id)}>
                  Set as active
                </Button>
              ) : (
                <h1 className="text-center text-neutral-200">Active</h1>
              )}
            </div>
          ))
        )}
      </div>
    </Main>
  );
};

export default SelectCharacter;
