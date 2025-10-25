// FactoryCore.tsx
import React, { useEffect, useMemo, useState, ReactNode } from "react";
import Button from "../../components/Button";
import H2 from "../../components/Typography/H2";
import ItemTile from "../../components/ItemTile";
import Item from "../../components/Typography/Item";
import { useCharacter } from "../../CharacterContext";

// Firebase
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDocFromServer,
} from "firebase/firestore";

const db = getFirestore();

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Light modal (no deps) */
export function SimpleModal({
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
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <Button
            onClick={onClose}
            aria-label="Lukk"
            style="exit"
            size="small-square"
          >
            <i className="fa-solid fa-xmark" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CircularProgress({
  value,
  active,
  size = 96,
  stroke = 8,
  trackClass = "text-neutral-700",
  activeBarClass = "text-sky-400",
  inactiveBarClass = "text-neutral-600",
  activeDotClass = "text-sky-300",
  inactiveDotClass = "text-neutral-500",
  center,
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
  center?: React.ReactNode;
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

/** Item shape expected by the picker */
export type FactoryItem = {
  id: string;
  name: string;
  tier?: number;
  img?: string;
  [k: string]: any;
};

type FactoryCoreProps = {
  /** UI copy */
  title: string; // e.g. "Produksjon"
  efficiencyLabel: ReactNode; // e.g. <strong>1 kule / time</strong>
  unitNoun: { singular: string; plural: string }; // e.g. {singular:"kule", plural:"kuler"}
  pickerTitle: string; // e.g. "Velg kule"
  selectButtonAria: string; // e.g. "Velg kule" / "Velg våpen"

  /** Data & behavior */
  items: FactoryItem[];
  getItemById: (id: string) => FactoryItem | null | undefined;
  selectionsPath:
    | "activeFactory.bulletSelections"
    | "activeFactory.weaponSelections";
  fallbackItemId: string; // e.g. "ib0001" or "iw0001"
  slotCount?: number; // default 2
  slotDurationMs: number; // per-slot duration
  resetSelectionsOnClaim?: boolean; // bullets = true, weapons = false (can keep)
  onGrant: (
    characterId: string,
    grants: Array<{ itemId: string; qty: number }>
  ) => Promise<void>;

  /** Messages */
  processing?: boolean;
  onSetMessage: (m: ReactNode) => void;
  onSetMessageType: (
    t: "success" | "failure" | "important" | "warning" | "info"
  ) => void;

  /** Optional custom renderers */
  renderCenterPreview?: (item: FactoryItem) => ReactNode; // shown inside ring when inactive & selected
  renderPickerItem?: (item: FactoryItem) => ReactNode; // custom row in modal
};

const FactoryCore: React.FC<FactoryCoreProps> = ({
  title,
  efficiencyLabel,
  unitNoun,
  pickerTitle,
  selectButtonAria,

  items,
  getItemById,
  selectionsPath,
  fallbackItemId,
  slotCount = 2,
  slotDurationMs,
  resetSelectionsOnClaim = true,
  onGrant,

  processing = false,
  onSetMessage,
  onSetMessageType,

  renderCenterPreview,
  renderPickerItem,
}) => {
  const { userCharacter } = useCharacter();

  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [selections, setSelections] = useState<(string | null)[]>(
    Array.from({ length: slotCount }, () => null)
  );

  // Server clock
  const [offsetMs, setOffsetMs] = useState(0);
  const [clockReady, setClockReady] = useState(false);
  const [tsLoaded, setTsLoaded] = useState(false);
  const [nowLocal, setNowLocal] = useState<number>(Date.now());

  const [busyStart, setBusyStart] = useState(false);
  const [busyClaim, setBusyClaim] = useState(false);

  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);

  // Sync server offset
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const ref = doc(db, "Meta", "timeSync");
        await setDoc(ref, { now: serverTimestamp() }, { merge: true });
        const snap = await getDocFromServer(ref);
        const ts: any = snap.data()?.now;
        if (ts?.toDate && !cancelled) {
          setOffsetMs(ts.toDate().getTime() - Date.now());
        }
      } finally {
        if (!cancelled) setClockReady(true);
      }
    }
    sync();
    const id = setInterval(sync, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Subscribe to character doc
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

        const sel: any[] =
          data?.activeFactory?.bulletSelections ??
          data?.activeFactory?.weaponSelections ??
          [];
        // respect the exact path we were told to use:
        const fromPath = selectionsPath
          .split(".")
          .reduce<any>((obj, key) => obj?.[key], data);
        const list: any[] = Array.isArray(fromPath) ? fromPath : sel;

        const next = Array.from({ length: slotCount }, (_, i) =>
          typeof list?.[i] === "string" ? (list[i] as string) : null
        );
        setSelections(next);
        setTsLoaded(true);
      },
      (err) => console.error("Failed to read factory state:", err)
    );
    return () => unsub();
  }, [userCharacter?.id, selectionsPath, slotCount]);

  // Tick
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

  // progress per slot (sequential)
  const bars = Array.from({ length: slotCount }, (_, i) => {
    const start = i * slotDurationMs;
    return clockReady ? clamp01((elapsed - start) / slotDurationMs) : 0;
  });

  const activeFlags = bars.map(
    (_, i) => active && clockReady && (i === 0 || bars[i - 1] >= 1)
  );

  const filledCount = clockReady
    ? Math.min(slotCount, Math.floor(elapsed / slotDurationMs))
    : 0;

  const isComplete = filledCount >= slotCount;

  async function persistSelections(next: (string | null)[]) {
    if (!userCharacter?.id) return;
    await updateDoc(doc(db, "Characters", userCharacter.id), {
      [selectionsPath]: next,
    } as any);
  }

  async function setSelection(slotIndex: number, itemId: string) {
    if (!userCharacter?.id) return;
    if (active) {
      onSetMessageType("warning");
      onSetMessage(
        <>Du kan ikke endre valg etter at produksjonen er startet.</>
      );
      return;
    }
    try {
      const next = [...selections];
      next[slotIndex] = itemId;
      setSelections(next);
      await persistSelections(next);
    } catch (e) {
      console.error("Kunne ikke lagre valg:", e);
      onSetMessageType("failure");
      onSetMessage(<>Kunne ikke lagre valg. Prøv igjen.</>);
    }
  }

  async function startProduction() {
    if (!userCharacter?.id || busyStart || busyClaim) return;

    // require all selections
    if (selections.some((s) => !s)) {
      onSetMessageType("warning");
      onSetMessage(<>Velg for alle slottene før du starter.</>);
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

  async function claimProduction() {
    if (!userCharacter?.id || busyClaim || busyStart) return;
    if (filledCount <= 0) return;

    setBusyClaim(true);
    try {
      // aggregate by itemId in slot order
      const grants: Record<string, number> = {};
      for (let i = 0; i < filledCount; i++) {
        const idForSlot = selections[i] || selections[0] || fallbackItemId;
        grants[idForSlot] = (grants[idForSlot] ?? 0) + 1;
      }
      const entries = Object.entries(grants).map(([itemId, qty]) => ({
        itemId,
        qty,
      }));

      await onGrant(userCharacter.id, entries);

      // reset production, optionally reset selections
      const update: any = { "activeFactory.productionStarted": null };
      if (resetSelectionsOnClaim) {
        update[selectionsPath] = Array.from({ length: slotCount }, () => null);
        setSelections(Array.from({ length: slotCount }, () => null));
      }
      await updateDoc(doc(db, "Characters", userCharacter.id), update);

      onSetMessageType("success");
      onSetMessage(
        <>
          Du fikk{" "}
          <strong>
            {filledCount}{" "}
            {filledCount > 1 ? unitNoun.plural : unitNoun.singular}
          </strong>
          :
          <div className="mt-1 flex gap-2 flex-wrap">
            {entries.map(({ itemId, qty }) => {
              const it = getItemById(itemId);
              return it ? (
                <span key={itemId} className="inline-flex items-center gap-1">
                  <Item name={it.name} tier={it.tier} /> × {qty}
                </span>
              ) : (
                <span key={itemId}>
                  {unitNoun.singular} × {qty}
                </span>
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

  const showProgress = clockReady && tsLoaded;

  const centerForSlot = (slotIndex: number) => {
    if (active) return undefined;
    const selId = selections[slotIndex];
    if (!selId) {
      return (
        <Button
          onClick={() => setPickerOpenFor(slotIndex)}
          aria-label={selectButtonAria}
          style="secondary"
          size="square"
        >
          <i className="fa-solid fa-plus" />
        </Button>
      );
    }
    const it = getItemById(selId);
    if (!it) return null;
    return (
      <button
        className="flex flex-col items-center gap-1 text-xs text-neutral-200 hover:text-white"
        onClick={() => setPickerOpenFor(slotIndex)}
        title="Endre valg"
      >
        {renderCenterPreview ? (
          renderCenterPreview(it)
        ) : it.img ? (
          <ItemTile
            name={it.name}
            img={it.img}
            tier={it.tier || 1}
            size="small"
          />
        ) : (
          <i className="fa-solid fa-circle-question" />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col">
      <p className="mb-4">
        Her kan du produsere {unitNoun.plural} som kan brukes til å angripe
        andre spillere.
      </p>

      <H2>{title}</H2>

      <div className="mb-4">
        <p>
          Effektivitet:{" "}
          <strong className="text-neutral-200">{efficiencyLabel}</strong>
        </p>
      </div>

      {!showProgress && active ? (
        <div className="mb-4 text-sm text-neutral-400">
          <i className="fa-solid fa-spinner fa-spin" /> Laster serverklokke…
        </div>
      ) : (
        <div className="grid grid-cols-2 mb-4 gap-3 w-fit">
          {bars.map((v, i) => (
            <div
              key={i}
              className="relative flex flex-col items-center justify-center"
            >
              <CircularProgress
                value={v}
                active={!!activeFlags[i]}
                center={centerForSlot(i)}
              />
              {/* Optional: show selected label under each ring */}
              {!active && selections[i] && (
                <button
                  type="button"
                  onClick={() => setPickerOpenFor(i)}
                  className="mt-1 text-sm text-neutral-300 hover:text-white"
                  title="Velg / endre"
                >
                  {(() => {
                    const it = selections[i]
                      ? getItemById(selections[i] as string)
                      : undefined;
                    return it ? <Item name={it.name} tier={it.tier} /> : null;
                  })()}
                </button>
              )}
            </div>
          ))}
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

      <SimpleModal
        open={pickerOpenFor !== null}
        onClose={() => setPickerOpenFor(null)}
        title={pickerTitle}
      >
        <div className="flex gap-2 flex-wrap">
          {items.map((it) => (
            <button
              key={it.id}
              className="text-left flex hover:bg-neutral-800 pr-4 gap-2 rounded-xl"
              onClick={async () => {
                if (pickerOpenFor === null) return;
                await setSelection(pickerOpenFor, it.id);
                setPickerOpenFor(null);
              }}
            >
              {renderPickerItem ? (
                renderPickerItem(it)
              ) : (
                <>
                  <ItemTile
                    name={it.name}
                    tier={it.tier || 1}
                    img={it.img || ""}
                  />
                  <div className="flex flex-col justify-center leading-5">
                    <Item name={it.name} tier={it.tier} />
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </SimpleModal>
    </div>
  );
};

export default FactoryCore;
