import { useCharacter } from "../CharacterContext";
import ItemTile from "./ItemTile";
import React, { useMemo } from "react";
import { getItemById } from "../Data/Items"; // <- to resolve catalog info

type EquipmentBoxProps = {
  icon: string;
  span?: boolean;
  children?: React.ReactNode;
};

const EquipmentBox = ({ icon, span, children }: EquipmentBoxProps) => {
  const classes =
    "w-16 h-16 border-2 border-neutral-600 bg-neutral-900 text-neutral-700 flex justify-center items-center rounded-xl " +
    (span ? "col-span-2 row-span-2 text-6xl" : "text-3xl");

  return (
    <div className={classes}>
      {children ?? <i className={`fa-solid fa-${icon}`}></i>}
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

const Equipment: React.FC = () => {
  const { userCharacter } = useCharacter();

  const eq = useMemo(
    () => (userCharacter?.equipment as Record<string, any>) || {},
    [userCharacter]
  );

  // Helper to render a slot: if equipped -> ItemTile, else icon box
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
          <ItemTile name={item.name} img={item.img} tier={item.tier} />
        </EquipmentBox>
      );
    }

    return <EquipmentBox icon={icon} span={span} />;
  }

  return (
    <section
      className="grid grid-cols-[max-content_auto_max-content] grid-rows-5 h-[400px] w-[287px] bg-neutral-800 p-2"
      style={{
        backgroundImage: "url('CharacterV4.jpg')",
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
      <Slot slotKey="shirt" icon="shirt" />
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
      <div></div>
      <div></div>
      <Slot slotKey="ringRight" fallbackKey="ring2" icon="ring" />
    </section>
  );
};

export default Equipment;
