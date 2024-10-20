// React
import { createContext, useContext, useState, useEffect } from "react";
import { Character, Stats, Reputation } from "./Interfaces/CharacterTypes";

// Firebase
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";

// Context
import { useAuth } from "./AuthContext";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface CharacterContextType {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  loading: boolean;
}

const CharacterContext = createContext<CharacterContextType | undefined>(
  undefined
);

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
};

export const CharacterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData && userData.activeCharacter) {
      setLoading(true);
      const charDocRef = doc(db, "Characters", userData.activeCharacter);

      // Set up the real-time listener
      const unsubscribe = onSnapshot(charDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const characterData = docSnapshot.data();

          if (
            characterData &&
            characterData.location &&
            characterData.stats &&
            characterData.username
          ) {
            const newCharacter: Character = {
              id: docSnapshot.id,
              location: characterData.location as string,
              stats: characterData.stats as Stats,
              img: characterData.img as string,
              username: characterData.username as string,
              username_lowercase: characterData.username_lowercase as string,
              createdAt: characterData.createdAt.toDate(),
              diedAt: characterData.diedAt
                ? characterData.diedAt.toDate()
                : null,
              lastCrimeTimestamp:
                characterData.lastCrimeTimestamp &&
                characterData.lastCrimeTimestamp.toDate
                  ? characterData.lastCrimeTimestamp.toDate()
                  : undefined,
              profileText: characterData.profileText as string,
              reputation: characterData.reputation as Reputation,
              status: characterData.status as string,
              uid: characterData.uid as string,
              parkingFacilities: characterData.parkingFacilities as any,
              cars: characterData.cars as any,
              familyId: characterData.familyId as string,
              familyName: characterData.familyName as string,
            };

            setCharacter(newCharacter);
          } else {
            console.error("Character data is incomplete or missing stats");
            setCharacter(null);
          }
        } else {
          console.error("No character document found!");
          setCharacter(null);
        }

        setLoading(false);
      });

      // Clean up the listener when the component unmounts or user changes
      return () => unsubscribe();
    } else {
      setCharacter(null);
      setLoading(false);
    }
  }, [userData]);

  if (loading) {
    return <div>Loading character data...</div>;
  }

  return (
    <CharacterContext.Provider value={{ character, setCharacter, loading }}>
      {children}
    </CharacterContext.Provider>
  );
};
