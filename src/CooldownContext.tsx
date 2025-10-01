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
import { db, rtdb } from "./firebase"; // <-- use your shared instances

/** Central cooldown durations (seconds) */
const COOLDOWN_SECONDS: Record<string, number> = {
  crime: 90,
  gta: 130,
  robbery: 150,
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

      // If offset changes, shift our stored expiries by delta so they stay in server scale
      const delta = next - prevOffsetRef.current;
      if (delta !== 0) {
        setExpiresAt((prev) => {
          if (!prev || Object.keys(prev).length === 0) return prev;
          const shifted: Record<string, number> = {};
          for (const [k, v] of Object.entries(prev)) shifted[k] = v + delta;
          return shifted;
        });
      }

      prevOffsetRef.current = next;
      setServerOffsetMs(next);
      setOffsetReady(true); // mark ready after first offset arrives
    });
    return () => unsub();
  }, []);

  // 2) Listen to the active character's doc (only after offset is ready)
  useEffect(() => {
    setExpiresAt({});
    setCooldowns({});

    if (!activeCharacterId || !offsetReady) return;

    const ref = doc(db, "Characters", activeCharacterId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() || {};
        const nextExp: Record<string, number> = {};

        // Derive absolute expiries from lastXTimestamp + duration
        for (const [type, sec] of Object.entries(COOLDOWN_SECONDS)) {
          const field =
            "last" + type.charAt(0).toUpperCase() + type.slice(1) + "Timestamp"; // e.g., lastCrimeTimestamp
          const ts = data[field] as Timestamp | Date | undefined;
          if (!ts) continue;

          const last = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
          const exp = last.getTime() + sec * 1000;
          if (exp > serverNowMs()) nextExp[type] = exp;
        }

        setExpiresAt(nextExp);

        // Update visible seconds immediately (no need to wait for tick)
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
      }
    );

    return () => unsub();
  }, [activeCharacterId, offsetReady, db, serverOffsetMs]); // serverOffsetMs in deps is OK; we recompute remaining immediately anyway

  // 3) Single ticking interval to update remaining seconds
  useEffect(() => {
    if (!offsetReady) return;

    const id = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAt, offsetReady, serverOffsetMs]);

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

    // IMPORTANT: if the server offset isn't ready, don't do an optimistic start.
    // Let the serverTimestamp write + onSnapshot set the correct absolute expiry,
    // which prevents starting at 83/84 instead of 90.
    if (offsetReady) {
      // optimistic expiry using *server* time
      const optimisticExp = serverNowMs() + duration * 1000;
      setExpiresAt((prev) => ({ ...prev, [cooldownType]: optimisticExp }));
      setCooldowns((prev) => ({ ...prev, [cooldownType]: duration }));
    }

    // Authoritative write so all tabs/devices sync via onSnapshot
    await updateDoc(doc(db, "Characters", activeCharacterId), {
      [field]: serverTimestamp(),
      lastActive: serverTimestamp(),
    });

    // If we skipped the optimistic path (offset not ready), the snapshot above
    // will set the correct value as soon as the server timestamp is written.
  };

  // Legacy no-op
  const fetchCooldown = () => {};

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
