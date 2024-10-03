// React
import { createContext, useContext, useState, useEffect } from "react";

// Firebase
import { doc, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";

// Context
import { useAuth } from "./AuthContext";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create a context for character data
const CharacterContext = createContext<any>(null);

export const useCharacter = () => {
  return useContext(CharacterContext);
};

export const CharacterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData } = useAuth();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacterData = async () => {
      if (userData && userData.activeCharacter) {
        setLoading(true);
        try {
          const charDocRef = doc(db, "Characters", userData.activeCharacter);
          const charDocSnap = await getDoc(charDocRef);
          if (charDocSnap.exists()) {
            setCharacter({ id: charDocSnap.id, ...charDocSnap.data() });
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
