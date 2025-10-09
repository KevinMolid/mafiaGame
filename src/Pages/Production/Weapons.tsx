import React, { useEffect, useMemo, useState, ReactNode } from "react";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import H1 from "../../components/Typography/H1";
import { useCharacter } from "../../CharacterContext";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDocFromServer,
} from "firebase/firestore";

type Props = {
  onSell: () => void | Promise<void>;
  processing?: boolean;
  onSetMessage: (m: ReactNode) => void;
  onSetMessageType: (
    t: "success" | "failure" | "important" | "warning" | "info"
  ) => void;
};

const db = getFirestore();

// Testing: 30s per slot. Real: 4 hours.
const FOUR_HOURS_MS = 1 * 30 * 1000;
// const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function CircularProgress({
  value,
  active,
  size = 80,
  stroke = 8,
  trackClass = "text-neutral-700",
  activeBarClass = "text-sky-400",
  inactiveBarClass = "text-neutral-600",
  activeDotClass = "text-sky-300",
  inactiveDotClass = "text-neutral-500",
  label,
}: {
  value: number;
  active: boolean;
  size?: number;
  stroke?: number;
  trackClass?: string;
  activeBarClass?: string;
  inactiveBarClass?: string;
  activeDotClass?: string;
  inactiveDotClass?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = clamp01(value);
  const dash = v * c;
  const pct = Math.round(v * 100);
  const text = label ?? `${pct}%`;

  const barClass = active ? activeBarClass : inactiveBarClass;
  const dotClass = active ? activeDotClass : inactiveDotClass;

  const theta = -Math.PI / 2 + v * 2 * Math.PI;
  const cx = size / 2;
  const cy = size / 2;
  const dotX = cx + r * Math.cos(theta);
  const dotY = cy + r * Math.sin(theta);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
      aria-label={text}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth={stroke}
        className={trackClass}
        stroke="currentColor"
        fill="none"
        opacity={0.5}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth={stroke}
        className={barClass}
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {v > 0 && (
        <circle
          cx={dotX}
          cy={dotY}
          r={Math.max(2.5, stroke * 0.45)}
          className={dotClass}
          fill="currentColor"
        />
      )}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-neutral-200"
        fontSize={Math.max(11, Math.floor(size * 0.22))}
        fontWeight={600}
      >
        {text}
      </text>
    </svg>
  );
}

const Weapons: React.FC<Props> = ({
  onSell,
  processing = false,
  onSetMessage,
  onSetMessageType,
}) => {
  const { userCharacter } = useCharacter();

  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);

  // Server clock handling
  const [offsetMs, setOffsetMs] = useState(0);
  const [clockReady, setClockReady] = useState(false);
  const [tsLoaded, setTsLoaded] = useState(false);
  const [nowLocal, setNowLocal] = useState<number>(Date.now());

  const [busyStart, setBusyStart] = useState(false);

  // Sync server time (one-shot + periodic resync). Gate progress until first sync completes.
  useEffect(() => {
    let cancelled = false;

    async function syncServerOffset() {
      try {
        const ref = doc(db, "Meta", "timeSync");
        await setDoc(ref, { now: serverTimestamp() }, { merge: true });
        const snap = await getDocFromServer(ref);
        const ts: any = snap.data()?.now;
        if (ts?.toDate && !cancelled) {
          setOffsetMs(ts.toDate().getTime() - Date.now());
        }
      } catch {
        // fallback to local clock
      } finally {
        if (!cancelled) setClockReady(true);
      }
    }

    syncServerOffset();
    const id = setInterval(syncServerOffset, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Subscribe to productionStarted
  useEffect(() => {
    if (!userCharacter?.id) return;
    const ref = doc(db, "Characters", userCharacter.id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as any;
        const ts = data?.activeFactory?.productionStarted;
        if (ts?.toDate) setStartedAtMs(ts.toDate().getTime());
        else if (typeof ts === "number") setStartedAtMs(ts);
        else setStartedAtMs(null);
        setTsLoaded(true);
      },
      (err) => console.error("Failed to read productionStarted:", err)
    );
    return () => unsub();
  }, [userCharacter?.id]);

  // Animation tick
  useEffect(() => {
    const id = setInterval(() => setNowLocal(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowServer = nowLocal + offsetMs;
  const active = !!startedAtMs;

  const elapsed = useMemo(() => {
    if (!clockReady || !startedAtMs) return 0;
    return Math.max(0, nowServer - startedAtMs);
  }, [clockReady, nowServer, startedAtMs]);

  // Two sequential slots
  const bar1 = clockReady ? clamp01(elapsed / FOUR_HOURS_MS) : 0;
  const bar2 = clockReady
    ? clamp01((elapsed - FOUR_HOURS_MS) / FOUR_HOURS_MS)
    : 0;

  // Blue activation per slot
  const active1 = active && clockReady;
  const active2 = active && clockReady && bar1 >= 1;

  // Count of completed slots
  const filledCount = clockReady
    ? Math.min(2, Math.floor(elapsed / FOUR_HOURS_MS))
    : 0;
  const isComplete = filledCount >= 2;

  async function startProduction() {
    if (!userCharacter?.id || busyStart) return;
    setBusyStart(true);

    // tell parent immediately
    onSetMessageType("info");
    onSetMessage(<>Produksjon startet.</>);

    try {
      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "activeFactory.productionStarted": serverTimestamp(),
      });
    } catch (err) {
      console.error("Kunne ikke starte produksjonen:", err);
      onSetMessageType("failure");
      onSetMessage(<>Noe gikk galt ved start. Prøv igjen.</>);
    } finally {
      setBusyStart(false);
    }
  }

  async function claimProduction() {
    if (!userCharacter?.id) return;
    if (filledCount <= 0) return;

    try {
      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "activeFactory.productionStarted": null,
      });
      onSetMessageType("success");
      onSetMessage(
        <>
          Du fikk <strong>{filledCount}</strong> våpen.
        </>
      );
    } catch (err) {
      console.error("Kunne ikke hente ut produksjon:", err);
      onSetMessageType("failure");
      onSetMessage(<>Noe gikk galt. Prøv igjen.</>);
    }
  }

  const buttonLabel = !active ? (
    <>Start</>
  ) : isComplete ? (
    <>Hent ut</>
  ) : (
    <>Produserer...</>
  );
  const buttonDisabled = busyStart || (active && !isComplete);
  const onButtonClick = () => {
    if (!active) return startProduction();
    if (isComplete) return claimProduction();
  };

  // Gate progress UI until we have BOTH server clock and the timestamp loaded
  const showProgress = clockReady && tsLoaded;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-baseline">
        <H1>Våpenfabrikk</H1>
        <Button
          style="text"
          size="text"
          onClick={() => {
            if (processing) return;
            if (confirm("Er du sikker på at du vil selge denne fabrikken?"))
              onSell();
          }}
          disabled={processing}
        >
          {processing ? "Behandler..." : "Legg ned fabrikken"}
        </Button>
      </div>

      <p className="mb-4">
        Her kan du produsere våpen som kan brukes til å angripe andre spillere.
      </p>

      <H2>Produksjon</H2>

      <div className="mb-4">
        <p>
          Pris:{" "}
          <strong className="text-neutral-200">
            <i className="fa-solid fa-dollar-sign"></i> 50 000
          </strong>
        </p>
        <p>
          Effektivitet:{" "}
          <strong className="text-neutral-200">1 våpen / 4 timer</strong>
        </p>
      </div>

      {!showProgress && active ? (
        <div className="mb-4 text-sm text-neutral-400">
          <i className="fa-solid fa-spinner fa-spin" /> Laster serverklokke…
        </div>
      ) : (
        <div className="grid grid-cols-2 mb-4 gap-3 w-fit">
          <div className="relative flex flex-col items-center justify-center">
            <CircularProgress value={bar1} active={active1} />
          </div>
          <div className="relative flex flex-col items-center justify-center">
            <CircularProgress value={bar2} active={active2} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onButtonClick} disabled={buttonDisabled}>
          {busyStart ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Starter…
            </>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>
    </div>
  );
};

export default Weapons;
