import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Character } from "./Interfaces/CharacterTypes";
import { getCurrentRank } from "./Functions/RankFunctions.tsx";
import {
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
import { useAuth } from "./AuthContext";
import RankUpModal from "./components/RankUpModal";
import { applyStatRewards } from "./Functions/RewardFunctions";

import { getRankReward, RankRewardConfig } from "./config/GameConfig";

import { db } from "./firebase";

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

  // Rank-up modal state
  const [pendingRankUp, setPendingRankUp] = useState<{
    rank: number;
    rankName: string;
    reward: RankRewardConfig | null;
  } | null>(null);

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
          const raw = docSnapshot.data() as any;

          if (raw && raw.location && raw.stats && raw.username) {
            // ✅ Pull everything with a spread so new fields (like `equipment`) flow through
            const newCharacter: Character = {
              id: docSnapshot.id,
              ...raw,
              // Normalize Timestamp-like fields:
              createdAt: raw.createdAt?.toDate?.() ?? raw.createdAt ?? null,
              diedAt: raw.diedAt?.toDate?.() ?? null,
              lastCrimeTimestamp: raw.lastCrimeTimestamp?.toDate?.(),
              lastGtaTimestamp: raw.lastGtaTimestamp?.toDate?.(),
              currentRank:
                typeof raw.currentRank === "number" ? raw.currentRank : 1,
            };

            // Ensure currentRank is set to 1 in the database if it was not set
            if (typeof raw.currentRank !== "number") {
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

                // 1) Rank reward config
                const reward = getRankReward(newRank);

                // 2) Apply money/diamonds reward via the tested helper
                if (reward) {
                  await applyStatRewards(newCharacter.id, {
                    money: reward.money ?? 0,
                    diamonds: reward.diamonds ?? 0,
                  });
                }

                // 3) Update rank + unlocks on the character doc
                const prevUnlocked: string[] =
                  (raw.unlockedFeatures as string[]) ?? [];
                const unlocks = reward?.unlocks ?? [];
                const mergedUnlocked =
                  unlocks.length > 0
                    ? Array.from(new Set([...prevUnlocked, ...unlocks]))
                    : prevUnlocked;

                const charDocRef3 = doc(db, "Characters", newCharacter.id);
                const updateData: any = {
                  currentRank: newRank,
                };
                if (unlocks.length > 0) {
                  updateData.unlockedFeatures = mergedUnlocked;
                }

                await setDoc(charDocRef3, updateData, { merge: true });

                // 4) Create alert for the player with reward + unlock info
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
                  reward: reward ?? {},
                  unlockedFeatures: reward?.unlocks ?? [],
                });

                // 5) Create global game event with the same info
                await addDoc(collection(db, "GameEvents"), {
                  eventType: "newRank",
                  userId: newCharacter.id,
                  userName: newCharacter.username,
                  newRank: newRankName,
                  reward: reward ?? {},
                  unlockedFeatures: reward?.unlocks ?? [],
                  timestamp: serverTimestamp(),
                });

                // 6) Show rank-up modal locally
                setPendingRankUp({
                  rank: newRank,
                  rankName: String(newRankName),
                  reward,
                });
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

            // Update character first (so consumers have stats/equipment/etc.)
            setUserCharacter(newCharacter);

            // --- Daily XP baseline from Firestore (shared across devices) ---
            const start = (raw.dailyXpStart as any) || {};
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
    return (
      <div className="w-full h-svh flex justify-center items-center">
        <p>Laster spillerdata...</p>
      </div>
    );
  }

  return (
    <CharacterContext.Provider value={value}>
      {pendingRankUp && (
        <RankUpModal
          data={pendingRankUp}
          onClose={() => setPendingRankUp(null)}
        />
      )}
      {children}
    </CharacterContext.Provider>
  );
};
