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

const SelectCharacter = () => {
  const { userData } = useAuth();
  const { character, setCharacter } = useCharacter();
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
        setCharacter({
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
          availableCharacters.map((availableCharacter) => (
            <div
              key={availableCharacter.id}
              className={
                "flex flex-col border min-w-44 " +
                (character?.id !== availableCharacter.id
                  ? "bg-neutral-800 border-neutral-600 px-4 py-2 rounded-lg"
                  : "border-neutral-400 px-4 py-2 rounded-lg")
              }
            >
              <p>
                <strong className="text-white">
                  {availableCharacter.username}
                </strong>
              </p>
              <div className="flex gap-4 mb-2">
                <p>
                  Status:{" "}
                  <span
                    className={
                      availableCharacter.status === "alive"
                        ? "text-green-500"
                        : availableCharacter.status === "dead"
                        ? "text-red-500"
                        : ""
                    }
                  >
                    {availableCharacter.status[0].toUpperCase() +
                      availableCharacter.status.slice(1)}
                  </span>
                </p>
              </div>
              {character?.id !== availableCharacter.id ? (
                <Button
                  onClick={() => handleSelectCharacter(availableCharacter.id)}
                >
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
