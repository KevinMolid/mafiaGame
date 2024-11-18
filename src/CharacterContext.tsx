import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Character, Stats, Reputation } from "./Interfaces/CharacterTypes";
import { getCurrentRank } from "./Functions/RankFunctions.tsx";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
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

  // Use useRef to keep prevXP across renders
  const prevXP = useRef<number | null>(null);

  useEffect(() => {
    if (userData && userData.activeCharacter) {
      setLoading(true);
      const charDocRef = doc(db, "Characters", userData.activeCharacter);

      const unsubscribe = onSnapshot(charDocRef, async (docSnapshot) => {
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
              lastGtaTimestamp:
                characterData.lastGtaTimestamp &&
                characterData.lastGtaTimestamp.toDate
                  ? characterData.lastGtaTimestamp.toDate()
                  : undefined,
              profileText: characterData.profileText as string,
              reputation: characterData.reputation as Reputation,
              status: characterData.status as string,
              uid: characterData.uid as string,
              parkingFacilities: characterData.parkingFacilities as any,
              cars: characterData.cars as any,
              familyId: characterData.familyId as string,
              familyName: characterData.familyName as string,
              activeFamilyApplication: characterData.activeFamilyApplication
                ? {
                    applicationId:
                      characterData.activeFamilyApplication.applicationId,
                    applicationText:
                      characterData.activeFamilyApplication.applicationText,
                    familyId: characterData.activeFamilyApplication.familyId,
                    familyName:
                      characterData.activeFamilyApplication.familyName,
                    appliedAt: characterData.activeFamilyApplication.appliedAt,
                  }
                : null,
              inJail: characterData.inJail as boolean,
              jailReleaseTime: characterData.jailReleaseTime as any,
            };

            const currentXP = newCharacter.stats.xp;
            // Handle XP rank change logic
            if (prevXP.current !== null && prevXP.current !== currentXP) {
              const prevRank = getCurrentRank(prevXP.current);
              const newRank = getCurrentRank(currentXP);

              if (prevRank !== newRank) {
                const alertRef = collection(
                  db,
                  "Characters",
                  newCharacter.id,
                  "alerts"
                );
                await addDoc(alertRef, {
                  type: "xp",
                  timestamp: new Date().toISOString(),
                  newRank: newRank,
                  read: false,
                });
              }
            }

            // Update character and prevXP to current XP
            setCharacter(newCharacter);
            prevXP.current = currentXP; // Set prevXP using useRef
          } else {
            console.error("Spillerdata er ufullstendig eller mangler stats.");
            setCharacter(null);
          }
        } else {
          console.error("Ingen spillerdokumenter funnet!");
          setCharacter(null);
        }

        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setCharacter(null);
      setLoading(false);
    }
  }, [userData]);

  if (loading) {
    return <div>Laster spillerdata...</div>;
  }

  return (
    <CharacterContext.Provider value={{ character, setCharacter, loading }}>
      {children}
    </CharacterContext.Provider>
  );
};
