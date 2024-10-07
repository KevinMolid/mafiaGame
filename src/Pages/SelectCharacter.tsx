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
    <div>
      <H1>Select Character</H1>
      <div>
        {characters.length === 0 ? (
          <p>You have no characters.</p>
        ) : (
          characters.map((character) => (
            <div
              key={character.id}
              className={
                selectedCharacter !== character.id
                  ? "flex flex-col border bg-neutral-800 border-neutral-600 p-4 mb-4 rounded-lg"
                  : "flex flex-col border bg-green-800 border-green-600 p-4 mb-4 rounded-lg text-green-200"
              }
            >
              <p>
                <strong className="text-white">{character.username}</strong>
              </p>
              <div className="flex gap-4 mb-2">
                <p>Location: {character.location}</p>
                <p>Status: {character.status}</p>
              </div>
              {selectedCharacter !== character.id ? (
                <Button onClick={() => handleSelectCharacter(character.id)}>
                  {selectedCharacter === character.id ? "Selected" : "Select"}
                </Button>
              ) : (
                <h1 className="text-center text-neutral-200">Selected</h1>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SelectCharacter;
