// React
import { createContext, useContext, useState, useEffect } from "react";
import { Character, Stats, Reputation } from "./Interfaces/CharacterTypes";

// Firebase
import { doc, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
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
    const fetchCharacterData = async () => {
      if (userData && userData.activeCharacter) {
        setLoading(true);
        try {
          const charDocRef = doc(db, "Characters", userData.activeCharacter);
          const charDocSnap = await getDoc(charDocRef);
          if (charDocSnap.exists()) {
            const characterData = charDocSnap.data();

            if (
              characterData &&
              characterData.location &&
              characterData.stats &&
              characterData.username
            ) {
              const newCharacter: Character = {
                id: charDocSnap.id,
                location: characterData.location as string,
                stats: characterData.stats as Stats,
                img: characterData.img as string,
                username: characterData.username as string,
                createdAt: characterData.createdAt.toDate(), // Assuming Firestore timestamp
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
        } catch (error) {
          console.error("Error fetching character data:", error);
          setCharacter(null);
        }
      } else {
        setCharacter(null);
      }
      setLoading(false);
    };

    fetchCharacterData();
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
