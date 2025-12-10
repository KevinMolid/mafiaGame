import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { onValue, ref as rtdbRef } from "firebase/database";
import { useCharacter } from "./CharacterContext";
import { db, rtdb } from "./firebase";
import { breakOut } from "./Functions/RewardFunctions"; // ⬅️ auto free when timer hits 0

import { activityConfig } from "./config/GameConfig";

const CRIME_COOLDOWNS: Record<string, number> = Object.fromEntries(
  activityConfig.crime.crimes.map((crime) => [
    crime.cooldownKey,
    crime.cooldownSeconds,
  ])
);

/** Central cooldown durations (seconds) */
const COOLDOWN_SECONDS: Record<string, number> = {
  crime: 90,
  gta: 130,
  robbery: 150,
  attack: 28800, // 60s * 60m * 8 = 8 hours
  ...CRIME_COOLDOWNS,
};

type CooldownContextType = {
  /** Remaining whole seconds per cooldown type (for the ACTIVE character) */
  cooldowns: Record<string, number>;
  /** Start a cooldown for the active character */
  startCooldown: (cooldownType: string) => Promise<void>;
  /** Legacy no-op */
  fetchCooldown: (
    cooldownType: string,
    duration: number,
    activeCharacter: string
  ) => void;
  /** Remaining jail time in whole seconds for the active character */
  jailRemainingSeconds: number;
  isInJail: boolean;
};

const CooldownContext = createContext<CooldownContextType | undefined>(
  undefined
);

export const CooldownProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userCharacter } = useCharacter();
  const activeCharacterId = userCharacter?.id || null;

  /** Absolute expiries (ms, in *server* time) */
  const [expiresAt, setExpiresAt] = useState<Record<string, number>>({});
  /** Public remaining seconds (whole) */
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  /** Jail expiry (ms, server time) */
  const [jailExpMs, setJailExpMs] = useState<number | null>(null);
  const [jailRemainingSeconds, setJailRemainingSeconds] = useState<number>(0);
  const [isInJail, setIsInJail] = useState(false);

  /** serverTime - localTime (ms), from RTDB special path */
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const prevOffsetRef = useRef<number>(0);
  const [offsetReady, setOffsetReady] = useState(false);

  const serverNowMs = () => Date.now() + serverOffsetMs;
  const remainingFromExp = (expMs: number) =>
    Math.max(0, Math.ceil((expMs - serverNowMs()) / 1000));

  // 1) Subscribe once to server-time offset
  useEffect(() => {
    const offRef = rtdbRef(rtdb, ".info/serverTimeOffset");
    const unsub = onValue(offRef, (snap) => {
      const next = typeof snap.val() === "number" ? snap.val() : 0;

      // Shift stored expiries by delta so they stay in server scale
      const delta = next - prevOffsetRef.current;
      if (delta !== 0) {
        setExpiresAt((prev) => {
          if (!prev || Object.keys(prev).length === 0) return prev;
          const shifted: Record<string, number> = {};
          for (const [k, v] of Object.entries(prev)) shifted[k] = v + delta;
          return shifted;
        });
        setJailExpMs((prev) => (prev == null ? prev : prev + delta));
      }

      prevOffsetRef.current = next;
      setServerOffsetMs(next);
      setOffsetReady(true);
    });
    return () => unsub();
  }, []);

  // 2) Listen to the active character's doc (only after offset is ready)
  useEffect(() => {
    setExpiresAt({});
    setCooldowns({});
    setJailExpMs(null);
    setJailRemainingSeconds(0);

    if (!activeCharacterId || !offsetReady) return;

    const ref = doc(db, "Characters", activeCharacterId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() || {};
        const nextExp: Record<string, number> = {};

        // Cooldowns
        for (const [type, sec] of Object.entries(COOLDOWN_SECONDS)) {
          const field =
            "last" + type.charAt(0).toUpperCase() + type.slice(1) + "Timestamp";
          const ts = data[field] as Timestamp | Date | undefined;
          if (!ts) continue;

          const last = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
          const exp = last.getTime() + sec * 1000;
          if (exp > serverNowMs()) nextExp[type] = exp;
        }

        // Jail expiry
        const inJailNow = data.inJail === true;
        setIsInJail(inJailNow);

        const jrt = data.jailReleaseTime as Timestamp | Date | undefined;
        if (inJailNow && jrt) {
          const jd = jrt instanceof Timestamp ? jrt.toDate() : new Date(jrt);
          const exp = jd.getTime();
          if (exp > serverNowMs()) {
            setJailExpMs(exp);
            setJailRemainingSeconds(remainingFromExp(exp));
          } else {
            setJailExpMs(null);
            setJailRemainingSeconds(0);
          }
        } else {
          // Not in jail (or no timestamp) → ensure timer stops
          setJailExpMs(null);
          setJailRemainingSeconds(0);
        }

        setExpiresAt(nextExp);

        // Visible seconds immediately
        const vis: Record<string, number> = {};
        for (const [type, exp] of Object.entries(nextExp)) {
          vis[type] = remainingFromExp(exp);
        }
        setCooldowns(vis);
      },
      (err) => {
        console.error("Cooldown onSnapshot error:", err);
        setExpiresAt({});
        setCooldowns({});
        setJailExpMs(null);
        setJailRemainingSeconds(0);
      }
    );

    return () => unsub();
  }, [activeCharacterId, offsetReady, db, serverOffsetMs]);

  // 3) Single ticking interval to update remaining seconds
  useEffect(() => {
    if (!offsetReady) return;

    const id = setInterval(() => {
      // Cooldowns
      setCooldowns((prev) => {
        if (!Object.keys(expiresAt).length) return {};
        const next: Record<string, number> = {};
        let changed = false;
        for (const [type, exp] of Object.entries(expiresAt)) {
          const v = remainingFromExp(exp);
          next[type] = v;
          if (prev[type] !== v) changed = true;
        }
        return changed ? next : prev;
      });

      // Jail
      setJailRemainingSeconds((prev) => {
        const v = isInJail && jailExpMs ? remainingFromExp(jailExpMs) : 0;

        // Only auto-free if we *are* in jail and cross to 0
        if (isInJail && prev > 0 && v === 0 && activeCharacterId) {
          breakOut(activeCharacterId).catch((e) =>
            console.error("Auto breakOut failed:", e)
          );
        }
        return v;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [
    expiresAt,
    offsetReady,
    serverOffsetMs,
    jailExpMs,
    activeCharacterId,
    isInJail,
  ]);

  // 4) Start cooldown
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

    // Optimistic (if offset ready)
    if (offsetReady) {
      const optimisticExp = serverNowMs() + duration * 1000;
      setExpiresAt((prev) => ({ ...prev, [cooldownType]: optimisticExp }));
      setCooldowns((prev) => ({ ...prev, [cooldownType]: duration }));
    }

    // Authoritative write
    await updateDoc(doc(db, "Characters", activeCharacterId), {
      [field]: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  };

  // Legacy no-op
  const fetchCooldown = () => {};

  const value: CooldownContextType = useMemo(
    () => ({
      cooldowns,
      startCooldown,
      fetchCooldown,
      jailRemainingSeconds,
      isInJail,
    }),
    [cooldowns, jailRemainingSeconds, isInJail]
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
