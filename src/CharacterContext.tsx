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
  runTransaction,
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
  /** XP since Oslo midnight, shared across devices */
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

  // --- Daily XP state (now sourced from Firestore) ---
  const [baselineXp, setBaselineXp] = useState<number>(0);
  const [xpToday, setXpToday] = useState<number>(0);
  const [baselineDate, setBaselineDate] = useState<string>("");

  // Ensure a daily baseline exists in Firestore for the current Oslo day
  const ensureDailyBaselineInDb = useCallback(
    async (characterId: string, currentXp: number) => {
      const today = getOsloYmd();
      const ref = doc(db, "Characters", characterId);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const v = snap.data() as any;
        const start = v.dailyXpStart || {};
        const date: string | undefined = start.date;
        const baseline: number | undefined = start.baseline;

        if (date !== today || typeof baseline !== "number") {
          tx.update(ref, {
            dailyXpStart: { date: today, baseline: currentXp },
          });
        }
      });
    },
    []
  );

  const refreshDailyBaseline = useCallback(() => {
    if (!userCharacter) return;
    const currentXp = userCharacter.stats?.xp ?? 0;
    // Reset baseline to "now" for the current Oslo day (effects all devices)
    ensureDailyBaselineInDb(userCharacter.id, currentXp);
    setBaselineXp(currentXp);
    setXpToday(0);
    setBaselineDate(getOsloYmd());
  }, [userCharacter, ensureDailyBaselineInDb]);

  // --- Remove old localStorage daily XP baselines (legacy cleanup) ---
  const purgeLegacyDailyXpLocalStorage = () => {
    try {
      const prefix = "xp:baseline:";
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) toDelete.push(k);
      }
      toDelete.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore (SSR or restricted storage)
    }
  };

  useEffect(() => {
    purgeLegacyDailyXpLocalStorage();
  }, []);

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
              const charDocRef2 = doc(db, "Characters", newCharacter.id);
              await setDoc(charDocRef2, { currentRank: 1 }, { merge: true });
            }

            // Handle XP rank change logic
            const currentXP = newCharacter.stats?.xp ?? 0;
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

                await addDoc(collection(db, "GameEvents"), {
                  eventType: "newRank",
                  userId: newCharacter.id,
                  userName: newCharacter.username,
                  newRank: newRankName,
                  timestamp: serverTimestamp(),
                });

                // Update the character's current rank in the database
                const charDocRef3 = doc(db, "Characters", newCharacter.id);
                await setDoc(
                  charDocRef3,
                  { currentRank: newRank },
                  { merge: true }
                );
              }
            } else if (
              typeof newRank === "number" &&
              newRank < newCharacter.currentRank
            ) {
              // If the new rank is lower, update without adding an alert
              const charDocRef4 = doc(db, "Characters", newCharacter.id);
              await setDoc(
                charDocRef4,
                { currentRank: newRank },
                { merge: true }
              );
            }

            // Update character first (so consumers have stats)
            setUserCharacter(newCharacter);

            // --- Daily XP baseline from Firestore (shared across devices) ---
            const start = (characterData.dailyXpStart as any) || {};
            const startDate: string | undefined = start.date;
            const startBaseline: number | undefined = start.baseline;
            const today = getOsloYmd();

            if (startDate !== today || typeof startBaseline !== "number") {
              // First time today (or missing) → set baseline in DB
              await ensureDailyBaselineInDb(newCharacter.id, currentXP);
              setBaselineXp(currentXP);
              setXpToday(0);
              setBaselineDate(today);
            } else {
              setBaselineXp(startBaseline);
              setXpToday(Math.max(0, currentXP - startBaseline));
              setBaselineDate(startDate);
            }
          } else {
            console.error("Spillerdata er ufullstendig eller mangler stats.");
            setUserCharacter(null);
            setBaselineXp(0);
            setXpToday(0);
            setBaselineDate("");
          }
        } else {
          console.error("Ingen spillerdokumenter funnet!");
          setUserCharacter(null);
          setBaselineXp(0);
          setXpToday(0);
          setBaselineDate("");
        }

        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setUserCharacter(null);
      setBaselineXp(0);
      setXpToday(0);
      setBaselineDate("");
      setLoading(false);
    }
  }, [userData, ensureDailyBaselineInDb]);

  // Watch for Oslo day rollover (e.g., tab left open) and for XP changes
  useEffect(() => {
    if (!userCharacter) return;

    const id = setInterval(() => {
      const today = getOsloYmd();
      const currentXp = userCharacter.stats?.xp ?? 0;

      // Recompute xpToday live within the same day
      setXpToday(Math.max(0, currentXp - baselineXp));

      // New Oslo day while app is open → roll the baseline once (DB + local)
      if (baselineDate && today !== baselineDate) {
        ensureDailyBaselineInDb(userCharacter.id, currentXp);
        setBaselineXp(currentXp);
        setXpToday(0);
        setBaselineDate(today);
      }
    }, 60_000); // every minute

    return () => clearInterval(id);
  }, [userCharacter, baselineXp, baselineDate, ensureDailyBaselineInDb]);

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
