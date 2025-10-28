// components/CharacterListJail.tsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

import { useCharacter } from "../CharacterContext";
import Username from "./Typography/Username";
import Button from "./Button";
import InfoBox from "./InfoBox";

import { serverNow } from "../Functions/serverTime";
import { mmss } from "../Functions/TimeFunctions";
import { arrest } from "../Functions/RewardFunctions";

// ---- Simple tunables for prison actions (match original) ----
const BRIBE_COST = 10_000; // fast pris
const CHANCE_BRIBE = 0.6; // 60% sjanse
const CHANCE_BREAKOUT = 0.35; // 35% sjanse

// Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---- Utils (same as original) ----
function normalizeTs(val: any): Timestamp | null {
  if (!val) return null;
  if (typeof (val as any).toMillis === "function") return val as Timestamp;
  if (typeof val.seconds === "number" && typeof val.nanoseconds === "number") {
    return new Timestamp(val.seconds, val.nanoseconds);
  }
  if (typeof val === "number") return Timestamp.fromMillis(val);
  const d = val instanceof Date ? val : new Date(val);
  if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
  return null;
}

function useSecondTicker() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

type JailCharacter = {
  id: string;
  username: string;
  jailReleaseTime: Timestamp | null;
};

function JailList({
  characters,
  location,
  onBribe,
  onBreakout,
  onClick,
  inJail,
}: {
  characters: JailCharacter[];
  location?: string;
  onBribe?: (id: string) => void;
  onBreakout?: (id: string) => void;
  onClick?: (username: string) => void;
  inJail?: boolean;
}) {
  useSecondTicker();

  const jailedSorted = useMemo(() => {
    const now = serverNow();
    return characters
      .filter((c) => c.jailReleaseTime && c.jailReleaseTime.toMillis() > now)
      .sort(
        (a, b) => a.jailReleaseTime!.toMillis() - b.jailReleaseTime!.toMillis()
      );
  }, [characters]);

  if (jailedSorted.length === 0) {
    return (
      <p className="text-neutral-400">
        Det er for øyeblikket ingen innsatte i {location ?? "byen"}.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {jailedSorted.map((c) => {
        const endMs = c.jailReleaseTime!.toMillis();
        const remainingSec = Math.max(
          0,
          Math.ceil((endMs - serverNow()) / 1000)
        );
        return (
          <li key={c.id} className="flex items-center gap-4">
            {onClick ? (
              <button onClick={() => onClick(c.username)}>{c.username}</button>
            ) : (
              <Username character={c as any} />
            )}
            <span className="text-neutral-200 font-medium">
              {mmss(remainingSec)}
            </span>

            {!inJail && (
              <>
                <Button
                  size="text"
                  style="text"
                  disabled={remainingSec <= 0}
                  onClick={() => onBribe?.(c.id)}
                  title={`Koster ${BRIBE_COST.toLocaleString("nb-NO")} kr`}
                >
                  Bestikk vakter
                </Button>

                <Button
                  size="text"
                  style="text"
                  disabled={remainingSec <= 0}
                  onClick={() => onBreakout?.(c.id)}
                >
                  Bryt ut
                </Button>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type MsgKind = "success" | "warning" | "info" | "failure";

export default function CharacterListJail({
  onClick,
  inJail = false,
}: {
  onClick?: (receiver: string) => void;
  inJail?: boolean;
}) {
  const { userCharacter } = useCharacter();
  const [characters, setCharacters] = useState<JailCharacter[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<MsgKind>("info");
  const [loading, setLoading] = useState(true);

  // ----- Load jailed players in same city (realtime), exactly like original -----
  useEffect(() => {
    if (!userCharacter?.location) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const qRef = query(
      collection(db, "Characters"),
      where("location", "==", userCharacter.location),
      where("inJail", "==", true)
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const data = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            username: v.username,
            jailReleaseTime: normalizeTs(v.jailReleaseTime),
          } as JailCharacter;
        });
        setCharacters(data);
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot(jail) failed:", err);
        setCharacters([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userCharacter?.location]);

  // ---------- Jail actions (identical logic) ----------
  async function freeTarget(targetId: string) {
    await updateDoc(doc(db, "Characters", targetId), {
      inJail: false,
      jailReleaseTime: null,
    });
  }

  async function isStillJailed(targetId: string) {
    const snap = await getDoc(doc(db, "Characters", targetId));
    if (!snap.exists()) return false;
    const v = snap.data() as any;
    if (!v.inJail) return false;
    const ts = normalizeTs(v.jailReleaseTime);
    if (!ts) return false;
    return ts.toMillis() > serverNow();
  }

  const fmtKr = (n: number) => n.toLocaleString("nb-NO");

  const handleBribe = async (targetId: string) => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være innlogget med en spillkarakter.");
      return;
    }
    try {
      const jailed = await isStillJailed(targetId);
      if (!jailed) {
        setMessageType("info");
        setMessage("Spilleren er ikke lenger i fengsel.");
        return;
      }

      const money = userCharacter.stats?.money ?? 0;
      if (money < BRIBE_COST) {
        setMessageType("warning");
        setMessage(`Du har ikke nok penger. Pris: ${fmtKr(BRIBE_COST)} kr.`);
        return;
      }

      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "stats.money": Math.max(0, money - BRIBE_COST),
      });

      const success = Math.random() < CHANCE_BRIBE;

      if (success) {
        await freeTarget(targetId);
        setMessageType("success");
        setMessage(`Du bestakk vaktene og frigjorde spilleren!`);
      } else {
        await arrest(userCharacter);
        setMessageType("failure");
        setMessage(`Bestikkelsen mislyktes. Du ble tatt og satt i fengsel.`);
      }
    } catch (err) {
      console.error("Bribe failed:", err);
      setMessageType("failure");
      setMessage("Noe gikk galt. Prøv igjen.");
    }
  };

  const handleBreakout = async (targetId: string) => {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Du må være innlogget med en spillkarakter.");
      return;
    }
    try {
      const jailed = await isStillJailed(targetId);
      if (!jailed) {
        setMessageType("info");
        setMessage("Spilleren er ikke lenger i fengsel.");
        return;
      }

      const success = Math.random() < CHANCE_BREAKOUT;

      if (success) {
        await freeTarget(targetId);
        setMessageType("success");
        setMessage(`Du brøt spilleren ut av fengsel!`);
      } else {
        await arrest(userCharacter);
        setMessageType("failure");
        setMessage(`Utbruddsforsøket mislyktes. Du ble satt i fengsel.`);
      }
    } catch (err) {
      console.error("Breakout failed:", err);
      setMessageType("failure");
      setMessage("Noe gikk galt. Prøv igjen.");
    }
  };

  // ----- Loading / empty states (match original wording) -----
  if (loading) {
    return <p>Laster spillere...</p>;
  }

  return (
    <section>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <JailList
        characters={characters}
        location={userCharacter?.location}
        onClick={onClick}
        onBribe={handleBribe}
        onBreakout={handleBreakout}
        inJail={inJail}
      />
      {!inJail && (
        <p className="text-xs text-neutral-500 mt-2">
          Sjanser: Bestikk {Math.round(CHANCE_BRIBE * 100)}%, Bryt ut{" "}
          {Math.round(CHANCE_BREAKOUT * 100)}%. Bestikkelse koster{" "}
          <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{BRIBE_COST.toLocaleString("nb-NO")}</strong>.
        </p>
      )}
    </section>
  );
}
