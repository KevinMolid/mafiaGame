import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Character, Stats, Reputation } from "./Interfaces/CharacterTypes";
import { getCurrentRank } from "./Functions/RankFunctions.tsx";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import { useAuth } from "./AuthContext";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface CharacterContextType {
  userCharacter: Character | null;
  setUserCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
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
  const [userCharacter, setUserCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const alertAddedRef = useRef<boolean>(false); // Ref to track alert addition

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
              role: characterData.role as string,
              location: characterData.location as string,
              stats: characterData.stats as Stats,
              img: characterData.img as string,
              currentRank:
                typeof characterData.currentRank === "number"
                  ? characterData.currentRank
                  : 1,
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
              airplane: characterData.airplane as any,
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
              friends: characterData.friends as any,
              blacklist: characterData.blacklist as any,
            };

            // Ensure currentRank is set to 1 in the database if it was not set
            if (typeof characterData.currentRank !== "number") {
              const charDocRef = doc(db, "Characters", newCharacter.id);
              await setDoc(charDocRef, { currentRank: 1 }, { merge: true });
            }

            // Handle XP rank change logic
            const currentXP = newCharacter.stats.xp;
            const newRank = getCurrentRank(currentXP, "number");
            const newRankName = getCurrentRank(currentXP);
            if (
              typeof newRank === "number" &&
              newRank > newCharacter.currentRank
            ) {
              const alertQuery = query(
                collection(db, "Characters", newCharacter.id, "alerts"),
                where("type", "==", "xp"),
                where("newRank", "==", newRankName)
              );

              // Wait for the query to complete before proceeding
              const existingAlerts = await getDocs(alertQuery);

              if (existingAlerts.empty && !alertAddedRef.current) {
                alertAddedRef.current = true; // Set flag before adding to ensure it's only set once
                const alertRef = collection(
                  db,
                  "Characters",
                  newCharacter.id,
                  "alerts"
                );
                await addDoc(alertRef, {
                  type: "xp",
                  timestamp: serverTimestamp(),
                  newRank: newRankName,
                  read: false,
                });

                // Update the character's current rank in the database
                const charDocRef = doc(db, "Characters", newCharacter.id);
                await setDoc(
                  charDocRef,
                  { currentRank: newRank },
                  { merge: true }
                );
              }
            } else if (
              typeof newRank === "number" &&
              newRank < newCharacter.currentRank
            ) {
              // If the new rank is lower, update without adding an alert
              const charDocRef = doc(db, "Characters", newCharacter.id);
              await setDoc(
                charDocRef,
                { currentRank: newRank },
                { merge: true }
              );
            }

            // Update character
            setUserCharacter(newCharacter);
          } else {
            console.error("Spillerdata er ufullstendig eller mangler stats.");
            setUserCharacter(null);
          }
        } else {
          console.error("Ingen spillerdokumenter funnet!");
          setUserCharacter(null);
        }

        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setUserCharacter(null);
      setLoading(false);
    }
  }, [userData]);

  if (loading) {
    return <div>Laster spillerdata...</div>;
  }

  return (
    <CharacterContext.Provider
      value={{ userCharacter, setUserCharacter, loading }}
    >
      {children}
    </CharacterContext.Provider>
  );
};
