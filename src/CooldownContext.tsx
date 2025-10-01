import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useCharacter } from "./CharacterContext";

/** Map cooldown type -> duration in seconds (centralize here) */
const COOLDOWN_SECONDS: Record<string, number> = {
  crime: 90,
  gta: 130,
  robbery: 150,
  // add more...
};

type CooldownContextType = {
  /** remaining seconds for the ACTIVE character */
  cooldowns: Record<string, number>;
  /** start a cooldown for the active character (writes serverTimestamp) */
  startCooldown: (cooldownType: string) => Promise<void>;
  /** kept for backward-compat; safe no-op now */
  fetchCooldown: (
    cooldownType: string,
    duration: number,
    activeCharacter: string
  ) => void;
};

const CooldownContext = createContext<CooldownContextType | undefined>(
  undefined
);

export const CooldownProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const db = getFirestore();
  const { userCharacter } = useCharacter(); // CooldownProvider is inside CharacterProvider in your tree
  const activeCharacterId = userCharacter?.id || null;

  /** internal: per-type expiry time (ms since epoch) for current character */
  const [expiresAt, setExpiresAt] = useState<Record<string, number>>({});
  /** public: remaining seconds (rounded down, never negative) */
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // helper: compute remaining seconds now from expiresAt
  const computeRemaining = (expMs: number) =>
    Math.max(0, Math.ceil((expMs - Date.now()) / 1000));

  // On character change, reset and attach a real-time listener to that character’s doc
  useEffect(() => {
    setExpiresAt({});
    setCooldowns({});

    if (!activeCharacterId) return;

    const ref = doc(db, "Characters", activeCharacterId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() || {};

        // For each known cooldown type, derive an expiry based on lastXTimestamp + duration
        const nextExpires: Record<string, number> = {};
        for (const [type, sec] of Object.entries(COOLDOWN_SECONDS)) {
          const field =
            "last" + type.charAt(0).toUpperCase() + type.slice(1) + "Timestamp"; // e.g. lastCrimeTimestamp

          const ts = data[field] as Timestamp | Date | undefined;
          if (!ts) continue;

          const last = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
          const exp = last.getTime() + sec * 1000;
          // Only set if in the future; if already expired we won’t carry it
          if (exp > Date.now()) {
            nextExpires[type] = exp;
          }
        }

        setExpiresAt(nextExpires);
        // also update visible remaining immediately (no need to wait for the interval tick)
        const nextRemaining: Record<string, number> = {};
        for (const [type, exp] of Object.entries(nextExpires)) {
          nextRemaining[type] = computeRemaining(exp);
        }
        setCooldowns(nextRemaining);
      },
      (err) => {
        console.error("Cooldown onSnapshot error:", err);
        setExpiresAt({});
        setCooldowns({});
      }
    );

    return () => unsub();
  }, [db, activeCharacterId]);

  // A single interval to tick down remaining seconds derived from expiresAt
  useEffect(() => {
    const id = setInterval(() => {
      setCooldowns((prev) => {
        if (!Object.keys(expiresAt).length) return {};
        const next: Record<string, number> = {};
        let changed = false;
        for (const [type, exp] of Object.entries(expiresAt)) {
          const v = computeRemaining(exp);
          next[type] = v;
          if (prev[type] !== v) changed = true;
        }
        // If every value stayed the same, avoid triggering renders
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Start cooldown: write serverTimestamp; also optimistic local expiry so the UI feels snappy
  const startCooldown = async (cooldownType: string) => {
    if (!activeCharacterId) return;

    const duration = COOLDOWN_SECONDS[cooldownType];
    if (!duration) {
      console.warn(`Unknown cooldown type "${cooldownType}"`);
      return;
    }

    const field =
      "last" +
      cooldownType.charAt(0).toUpperCase() +
      cooldownType.slice(1) +
      "Timestamp";

    // optimistic local update
    const optimisticExp = Date.now() + duration * 1000;
    setExpiresAt((prev) => ({ ...prev, [cooldownType]: optimisticExp }));
    setCooldowns((prev) => ({ ...prev, [cooldownType]: duration }));

    // server-authoritative write so all tabs update through onSnapshot
    await updateDoc(doc(db, "Characters", activeCharacterId), {
      [field]: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  };

  // Backwards-compat shim — you can remove all external calls to this
  const fetchCooldown = () => {
    /* no-op, listener keeps everything in sync */
  };

  const value: CooldownContextType = useMemo(
    () => ({ cooldowns, startCooldown, fetchCooldown }),
    [cooldowns]
  );

  return (
    <CooldownContext.Provider value={value}>
      {children}
    </CooldownContext.Provider>
  );
};

export const useCooldown = () => {
  const ctx = useContext(CooldownContext);
  if (!ctx)
    throw new Error("useCooldown must be used within a CooldownProvider");
  return ctx;
};
