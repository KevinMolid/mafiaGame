import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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

/* ---------- Oslo time helper ---------- */
const getOsloYmd = (d: Date = new Date()): string => {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

const baselineKey = (userId?: string) => `xp:baseline:${userId ?? "anon"}`;

/* ---------- Context types ---------- */
interface DailyXpState {
  baselineXp: number;
  xpToday: number;
  refreshDailyBaseline: () => void;
}

interface CharacterContextType {
  userCharacter: Character | null;
  setUserCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  loading: boolean;
  /** New: XP since Oslo midnight */
  dailyXp: DailyXpState;
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

  // --- New: daily XP state ---
  const [baselineXp, setBaselineXp] = useState<number>(0);
  const [xpToday, setXpToday] = useState<number>(0);

  // Ensure we have a baseline for the current Oslo day and compute xpToday
  const ensureBaselineForToday = useCallback(
    (currentXp: number, userId?: string) => {
      const key = baselineKey(userId);
      const today = getOsloYmd();
      try {
        const raw = localStorage.getItem(key);
        const obj = raw ? JSON.parse(raw) : null;

        if (!obj || obj.date !== today) {
          // New day in Oslo → set a new baseline to current XP
          const next = { date: today, baseline: currentXp };
          localStorage.setItem(key, JSON.stringify(next));
          setBaselineXp(currentXp);
          setXpToday(0);
        } else {
          const base = typeof obj.baseline === "number" ? obj.baseline : 0;
          setBaselineXp(base);
          setXpToday(Math.max(0, currentXp - base));
        }
      } catch {
        const next = { date: today, baseline: currentXp };
        localStorage.setItem(key, JSON.stringify(next));
        setBaselineXp(currentXp);
        setXpToday(0);
      }
    },
    []
  );

  // Optional helper to re-evaluate the baseline now
  const refreshDailyBaseline = useCallback(() => {
    if (!userCharacter) return;
    ensureBaselineForToday(userCharacter.stats?.xp ?? 0, userCharacter.id);
  }, [userCharacter, ensureBaselineForToday]);

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

              const existingAlerts = await getDocs(alertQuery);

              if (existingAlerts.empty && !alertAddedRef.current) {
                alertAddedRef.current = true;
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

            // --- New: compute daily XP vs Oslo midnight ---
            ensureBaselineForToday(
              newCharacter.stats?.xp ?? 0,
              newCharacter.id
            );
          } else {
            console.error("Spillerdata er ufullstendig eller mangler stats.");
            setUserCharacter(null);
            setBaselineXp(0);
            setXpToday(0);
          }
        } else {
          console.error("Ingen spillerdokumenter funnet!");
          setUserCharacter(null);
          setBaselineXp(0);
          setXpToday(0);
        }

        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setUserCharacter(null);
      setBaselineXp(0);
      setXpToday(0);
      setLoading(false);
    }
  }, [userData, ensureBaselineForToday]);

  // Watch for Oslo day rollover (e.g., tab left open) and for XP changes
  useEffect(() => {
    if (!userCharacter) return;

    let lastOsloDate = getOsloYmd();
    const interval = setInterval(() => {
      const now = getOsloYmd();
      const currentXp = userCharacter.stats?.xp ?? 0;

      if (now !== lastOsloDate) {
        // New day in Oslo
        lastOsloDate = now;
        ensureBaselineForToday(currentXp, userCharacter.id);
      } else {
        // Same day: recompute xpToday if XP moved elsewhere in the app
        try {
          const key = baselineKey(userCharacter.id);
          const raw = localStorage.getItem(key);
          const obj = raw ? JSON.parse(raw) : null;
          const base = obj?.baseline ?? baselineXp;
          setXpToday(Math.max(0, currentXp - base));
        } catch {
          // If something odd in storage, reset baseline
          ensureBaselineForToday(currentXp, userCharacter.id);
        }
      }
    }, 60_000); // check each minute

    return () => clearInterval(interval);
  }, [userCharacter, baselineXp, ensureBaselineForToday]);

  const value = useMemo<CharacterContextType>(() => {
    return {
      userCharacter,
      setUserCharacter,
      loading,
      dailyXp: {
        baselineXp,
        xpToday,
        refreshDailyBaseline,
      },
    };
  }, [userCharacter, loading, baselineXp, xpToday, refreshDailyBaseline]);

  if (loading) {
    return <div>Laster spillerdata...</div>;
  }

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};
