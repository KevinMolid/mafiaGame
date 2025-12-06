// React
import React, { useMemo, useState } from "react";

// Components
import ItemTile from "./ItemTile";
import Item from "./Typography/Item";
import Button from "./Button";

// Functions
import { getItemById } from "../Data/Items";

// Context
import { useCharacter } from "../CharacterContext";

// Firebase
import {
  getFirestore,
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
const db = getFirestore();

type EquipmentBoxProps = {
  icon: string;
  span?: boolean;
  children?: React.ReactNode;
};

const EquipmentBox = ({ icon, span, children }: EquipmentBoxProps) => {
  const classes =
    "w-16 h-16 border shadow-inner shadow-black border-neutral-600 bg-gradient-to-br from-zinc-800 to-neutral-900 text-neutral-700 flex justify-center items-center rounded-xl " +
    (span ? "col-span-2 row-span-2 text-6xl" : "text-3xl");

  return (
    <div className={classes}>
      {children ?? (
        <i
          className={`fa-solid fa-${icon} bg-gradient-to-br from-zinc-700 to-neutral-500 bg-clip-text text-transparent`}
        ></i>
      )}
    </div>
  );
};

// Resolve an equipment entry that might be:
// - a full item object ({ name, img, tier, ... })
// - a minimal object ({ id: "iw0001" })
// - a plain string ("iw0001")
function resolveEquipped(entry: any) {
  if (!entry) return null;

  // If it looks complete enough for ItemTile, return as-is
  if (entry.name && entry.img && entry.tier) return entry;

  // If we have an id field or it's a string, try catalog lookup
  const typeId = typeof entry === "string" ? entry : entry.id;
  if (typeId) {
    const cat = getItemById(typeId);
    if (cat) {
      // Merge any extra fields saved in equipment over catalog
      return { ...cat, ...entry };
    }
  }

  // As a last resort, return what we have; ItemTile may still render with missing fields
  return entry;
}

type EquippedForModal = {
  slotKey: string;
  item: any;
} | null;

const Equipment: React.FC = () => {
  const { userCharacter } = useCharacter();
  const [modal, setModal] = useState<EquippedForModal>(null);
  const [busy, setBusy] = useState(false);

  const eq = useMemo(
    () => (userCharacter?.equipment as Record<string, any>) || {},
    [userCharacter]
  );

  async function unequip(slotKey: string) {
    if (!userCharacter?.id) return;
    setBusy(true);
    const charRef = doc(db, "Characters", userCharacter.id);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(charRef);
        const data = (snap.data() || {}) as any;
        const equipped = data?.equipment?.[slotKey];

        if (!equipped) {
          // nothing to do — already empty
          return;
        }

        // Build inventory payload (strip equip-specific fields)
        const {
          equippedAt,
          fromDocId,
          returnedFromSlot,
          returnedAt,
          unequippedAt,
          unequippedFrom,
          slot, // optional to keep, but not required in bags
          ...rest
        } = equipped ?? {};

        const invPayload = {
          ...rest,
          // Keep basic display fields if present:
          name: equipped.name ?? rest.name ?? "Uten navn",
          img: equipped.img ?? rest.img ?? null,
          tier: equipped.tier ?? rest.tier ?? 1,
          value: equipped.value ?? rest.value ?? 0,
          attack: equipped.attack ?? rest.attack ?? 1,
          capacity: equipped.capacity ?? rest.capacity ?? 0,
          usingBullets: equipped.usingBullets ?? rest.usingBullets ?? false,
          quantity: Number(equipped.quantity ?? rest.quantity ?? 1),
          slot: equipped.slot ?? rest.slot ?? null,
          // audit
          unequippedFrom: slotKey,
          unequippedAt: serverTimestamp(),
        };

        // Add back to inventory (new doc id)
        const backToInvRef = doc(
          collection(db, "Characters", userCharacter.id, "items")
        );
        tx.set(backToInvRef, invPayload);

        // Clear the equipment slot entirely
        tx.update(charRef, { [`equipment.${slotKey}`]: deleteField() });
      });
    } catch (e) {
      console.error("Unequip failed:", e);
    } finally {
      setBusy(false);
      setModal(null);
    }
  }

  // Helper to render a slot: if equipped -> ItemTile (clickable), else icon box
  function Slot({
    slotKey,
    icon,
    span,
    fallbackKey,
  }: {
    slotKey: string;
    icon: string;
    span?: boolean;
    fallbackKey?: string;
  }) {
    const raw =
      eq?.[slotKey] ?? (fallbackKey ? eq?.[fallbackKey] : undefined) ?? null;

    const item = resolveEquipped(raw);

    if (item) {
      return (
        <EquipmentBox icon={icon} span={span}>
          <button
            type="button"
            className="block p-0 m-0 leading-none focus:outline-none"
            title="Åpne handlinger for utstyr"
            onClick={() => setModal({ slotKey, item })}
          >
            <ItemTile
              name={item.name}
              img={item.img}
              tier={item.tier}
              tooltipImg={item.img}
              tooltipContent={
                <ul className="space-y-0.5">
                  {"attack" in item && (
                    <li>
                      Angrep:{" "}
                      <strong className="text-neutral-200">
                        +{item.attack ?? 0}
                      </strong>
                    </li>
                  )}
                  {"capacity" in item && (
                    <li>
                      Kapasitet:{" "}
                      <strong className="text-neutral-200">
                        {item.capacity ?? 1}
                      </strong>
                    </li>
                  )}
                  <li>
                    Verdi:{" "}
                    <strong className="text-neutral-200">
                      ${Number(item.value ?? 0).toLocaleString("nb-NO")}
                    </strong>
                  </li>
                </ul>
              }
            />
          </button>
        </EquipmentBox>
      );
    }

    return <EquipmentBox icon={icon} span={span} />;
  }

  const totals = useMemo(() => {
    let attack = 0;
    let defense = 0;

    Object.values(eq ?? {}).forEach((raw) => {
      const item = resolveEquipped(raw);
      if (!item) return;

      const a = Number(item.attack ?? 0);
      const d = Number(item.defense ?? 0);

      if (Number.isFinite(a)) attack += a;
      if (Number.isFinite(d)) defense += d;
    });

    return { attack, defense };
  }, [eq]);

  return (
    <>
      <section
        className="border border-neutral-600 grid grid-cols-[max-content_auto_max-content] grid-rows-5 h-[400px] w-[287px] bg-neutral-800 p-2 shadow-xl rounded-xl"
        style={{
          backgroundImage: "url('EquipmentBG.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundPositionY: "top",
        }}
      >
        {/* Row 1 */}
        <Slot slotKey="hat" icon="hat-cowboy" />
        <div></div>
        <Slot slotKey="glasses" icon="glasses" />

        {/* Row 2 */}
        <Slot slotKey="jacket" icon="shirt" />
        <div></div>
        <Slot slotKey="neck" icon="ribbon" />

        {/* Row 3 */}
        <Slot slotKey="boots" icon="socks" />
        <div></div>
        <Slot slotKey="gloves" icon="mitten" />

        {/* Row 4 */}
        <Slot slotKey="weapon" icon="gun" />
        <div></div>
        <Slot slotKey="ringLeft" fallbackKey="ring" icon="ring" />

        {/* Row 5 */}
        <div className="h-16 flex flex-col justify-end">
          <p>
            Angrep:{" "}
            <strong className="text-neutral-200">
              {totals.attack.toLocaleString("nb-NO")}
            </strong>
          </p>
          <p>
            Beskyttelse:{" "}
            <strong className="text-neutral-200">
              {totals.defense.toLocaleString("nb-NO")}
            </strong>
          </p>
        </div>
        <div></div>
        <Slot slotKey="ringRight" fallbackKey="ring2" icon="ring" />
      </section>

      {/* --- Equipped item modal (Unequip) --- */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Utstyrshandlinger"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Window */}
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {modal.item?.img ? (
                  <ItemTile
                    name={modal.item.name}
                    img={modal.item.img}
                    tier={modal.item.tier}
                  />
                ) : null}

                <div>
                  <p className="text-neutral-200 font-semibold leading-tight">
                    <Item name={modal.item?.name} tier={modal.item?.tier} />
                  </p>

                  <p className="text-neutral-400">
                    Verdi:{" "}
                    <strong className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign" />{" "}
                      {Number(modal.item?.value ?? 0).toLocaleString("nb-NO")}
                    </strong>
                  </p>

                  {"attack" in (modal.item ?? {}) && (
                    <p className="text-neutral-400">
                      Angrep:{" "}
                      <strong className="text-neutral-200">
                        +{modal.item?.attack ?? 0}
                      </strong>
                    </p>
                  )}

                  <div className="mt-4 flex gap-2 items-center">
                    <Button
                      type="button"
                      size="small"
                      disabled={busy}
                      onClick={() => unequip(modal.slotKey)}
                      title="Ta av og legg i sekken"
                    >
                      {busy ? "Arbeider..." : "Ta av"}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="small-square"
                style="exit"
                onClick={() => setModal(null)}
                aria-label="Lukk"
                title="Lukk"
              >
                <i className="fa-solid fa-xmark" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Equipment;
