import React, { useEffect, useMemo, useState, ReactNode } from "react";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import ItemTile from "../../components/ItemTile";
import Item from "../../components/Typography/Item";

import { useCharacter } from "../../CharacterContext";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDocFromServer,
  collection,
  writeBatch,
} from "firebase/firestore";

import { Weapons, getItemById } from "../../Data/Items";

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
// const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const FOUR_HOURS_MS = 1 * 30 * 1000;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Tiny modal/popover (no deps) */
function SimpleModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      aria-modal
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-[61] w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-900 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-lg font-semibold">
            {title || "Velg gjenstand"}
          </h3>
          <button
            className="text-neutral-300 hover:text-white p-1"
            onClick={onClose}
            aria-label="Lukk"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CircularProgress({
  value,
  active,
  size = 96,
  stroke = 8,
  trackClass = "text-neutral-700",
  activeBarClass = "text-sky-400",
  inactiveBarClass = "text-neutral-600",
  activeDotClass = "text-sky-300",
  inactiveDotClass = "text-neutral-500",
  label,
  center, // <- custom center content
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
  center?: React.ReactNode;
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
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
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
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 grid place-items-center">
        {center ?? (
          <span
            className="text-neutral-200 font-semibold"
            style={{ fontSize: Math.max(11, Math.floor(size * 0.22)) }}
          >
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

const WeaponFactory: React.FC<Props> = ({
  processing = false,
  onSetMessage,
  onSetMessageType,
}) => {
  const { userCharacter } = useCharacter();

  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);

  // Per-slot selections (item IDs), persisted under activeFactory.weaponSelections = [id0, id1]
  const [selections, setSelections] = useState<(string | null)[]>([null, null]);

  // Server clock handling
  const [offsetMs, setOffsetMs] = useState(0);
  const [clockReady, setClockReady] = useState(false);
  const [tsLoaded, setTsLoaded] = useState(false);
  const [nowLocal, setNowLocal] = useState<number>(Date.now());

  const [busyStart, setBusyStart] = useState(false);
  const [busyClaim, setBusyClaim] = useState(false);

  // Modal state
  const [pickerOpenFor, setPickerOpenFor] = useState<0 | 1 | null>(null);

  // Sync server time
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

  // Subscribe to production state + selections
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

        const sel: any[] = data?.activeFactory?.weaponSelections || [];
        setSelections([
          typeof sel[0] === "string" ? sel[0] : null,
          typeof sel[1] === "string" ? sel[1] : null,
        ]);

        setTsLoaded(true);
      },
      (err) => console.error("Failed to read factory state:", err)
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

  const active1 = active && clockReady;
  const active2 = active && clockReady && bar1 >= 1;

  // Completed slots => number of items to grant
  const filledCount = clockReady
    ? Math.min(2, Math.floor(elapsed / FOUR_HOURS_MS))
    : 0;
  const isComplete = filledCount >= 2;

  /** Persist a selection for a slot (0 or 1) */
  async function setSelection(slotIndex: 0 | 1, itemId: string) {
    if (!userCharacter?.id) return;
    if (active) {
      onSetMessageType("warning");
      onSetMessage(
        <>Du kan ikke endre valg etter at produksjonen er startet.</>
      );
      return;
    }
    try {
      const next = [...selections] as (string | null)[];
      next[slotIndex] = itemId;
      setSelections(next);
      await updateDoc(doc(db, "Characters", userCharacter.id), {
        "activeFactory.weaponSelections": next,
      });
    } catch (e) {
      console.error("Kunne ikke lagre valg:", e);
      onSetMessageType("failure");
      onSetMessage(<>Kunne ikke lagre valg. Prøv igjen.</>);
    }
  }

  async function startProduction() {
    if (!userCharacter?.id || busyStart || busyClaim) return;

    // Require both selections
    if (!selections[0] || !selections[1]) {
      onSetMessageType("warning");
      onSetMessage(<>Velg et våpen for begge slottene før du starter.</>);
      return;
    }

    setBusyStart(true);
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

  // CLAIM: grant filledCount items based on selections order, then reset productionStarted
  async function claimProduction() {
    if (!userCharacter?.id || busyClaim || busyStart) return;
    if (filledCount <= 0) return;

    setBusyClaim(true);
    try {
      const batch = writeBatch(db);

      // Grant in order (slot 0, then slot 1)
      for (let i = 0; i < filledCount; i++) {
        const idForSlot = selections[i] || selections[0] || "iw0001";
        const item = getItemById(idForSlot) || getItemById("iw0001");
        const ref = doc(
          collection(db, "Characters", userCharacter.id, "items")
        );
        const payload = {
          ...item,
          aquiredAt: serverTimestamp(),
        };
        batch.set(ref, payload);
      }

      // Reset production timestamp (keep selections so user can reuse if desired)
      batch.update(doc(db, "Characters", userCharacter.id), {
        "activeFactory.productionStarted": null,
      });

      await batch.commit();

      onSetMessageType("success");
      onSetMessage(
        <>
          Du fikk{" "}
          <strong>
            {filledCount} {filledCount > 1 ? "gjenstander" : "gjenstand"}
          </strong>
          :
          <div className="mt-1 flex gap-2">
            {Array.from({ length: filledCount }, (_, i) => {
              const id = selections[i] || selections[0] || "iw0001";
              const it = getItemById(id);
              return it ? (
                <Item key={i} name={it.name} tier={it.tier} />
              ) : (
                <span key={i}>Våpen</span>
              );
            })}
          </div>
        </>
      );
    } catch (err) {
      console.error("Kunne ikke hente ut produksjon:", err);
      onSetMessageType("failure");
      onSetMessage(<>Noe gikk galt. Prøv igjen.</>);
    } finally {
      setBusyClaim(false);
    }
  }

  const buttonLabel = !active
    ? "Start"
    : isComplete
    ? `Hent ut (${filledCount})`
    : "Produserer…";
  const buttonDisabled =
    processing || busyStart || busyClaim || (active && !isComplete);

  const onButtonClick = () => {
    if (!active) return startProduction();
    if (isComplete) return claimProduction();
  };

  // Gate progress UI until we have BOTH server clock and the timestamp loaded
  const showProgress = clockReady && tsLoaded;

  // Helpers to render center content for each slot when inactive
  const centerForSlot = (slot: 0 | 1) => {
    if (active) return undefined; // show percentage text
    const selId = selections[slot];
    if (!selId) {
      return (
        <button
          className="rounded-full h-9 w-9 grid place-items-center bg-neutral-800 hover:bg-neutral-700 text-white"
          onClick={() => setPickerOpenFor(slot)}
          aria-label="Velg gjenstand"
        >
          <i className="fa-solid fa-plus" />
        </button>
      );
    }
    const it = getItemById(selId);
    return (
      <button
        className="flex flex-col items-center gap-1 text-xs text-neutral-200 hover:text-white"
        onClick={() => setPickerOpenFor(slot)}
        title="Endre valg"
      >
        {/* small preview */}
        {it?.img ? (
          <img
            src={it.img}
            alt={it.name}
            className="h-8 w-8 rounded object-cover border border-neutral-700"
          />
        ) : (
          <i className="fa-solid fa-gun" />
        )}
        <span className="max-w-[72px] truncate">{it?.name || "Våpen"}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col">
      <p className="mb-4">
        Her kan du produsere våpen som kan brukes til å angripe andre spillere.
      </p>

      <H2>Produksjon</H2>

      <div className="mb-4">
        <p>
          Effektivitet:{" "}
          <strong className="text-neutral-200">1 gjenstand / 4 timer</strong>
        </p>
      </div>

      {!showProgress && active ? (
        <div className="mb-4 text-sm text-neutral-400">
          <i className="fa-solid fa-spinner fa-spin" /> Laster serverklokke…
        </div>
      ) : (
        <div className="grid grid-cols-2 mb-4 gap-3 w-fit">
          <div className="relative flex flex-col items-center justify-center">
            <CircularProgress
              value={bar1}
              active={active1}
              center={centerForSlot(0)}
            />
            <p className="mt-1 text-sm text-neutral-400">Slot 1</p>
          </div>
          <div className="relative flex flex-col items-center justify-center">
            <CircularProgress
              value={bar2}
              active={active2}
              center={centerForSlot(1)}
            />
            <p className="mt-1 text-sm text-neutral-400">Slot 2</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onButtonClick} disabled={buttonDisabled}>
          {busyStart ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Starter…
            </>
          ) : busyClaim ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Henter…
            </>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>

      {/* Picker modal */}
      <SimpleModal
        open={pickerOpenFor !== null}
        onClose={() => setPickerOpenFor(null)}
        title="Velg våpen"
      >
        <div className="flex gap-2">
          {Weapons.map((weapon) => (
            <button
              key={weapon.id}
              className="text-left"
              onClick={async () => {
                if (pickerOpenFor === null) return;
                await setSelection(pickerOpenFor, weapon.id);
                setPickerOpenFor(null);
              }}
            >
              <ItemTile
                name={weapon.name}
                tier={weapon.tier}
                img={weapon.img}
              />
            </button>
          ))}
        </div>
      </SimpleModal>
    </div>
  );
};

export default WeaponFactory;
