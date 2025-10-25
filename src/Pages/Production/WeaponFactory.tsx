// WeaponFactory.tsx
import React, { ReactNode } from "react";
import FactoryCore, { FactoryItem } from "./Factory";
import ItemTile from "../../components/ItemTile";
import Item from "../../components/Typography/Item";
import { Weapons, getItemById } from "../../Data/Items";
import {
  getFirestore,
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const db = getFirestore();

type Props = {
  processing?: boolean;
  onSetMessage: (m: ReactNode) => void;
  onSetMessageType: (
    t: "success" | "failure" | "important" | "warning" | "info"
  ) => void;
};

// Testing: 30s/slot
const FOUR_HOURS_MS = 1 * 30 * 1000;

const WeaponFactory: React.FC<Props> = ({
  processing,
  onSetMessage,
  onSetMessageType,
}) => {
  return (
    <FactoryCore
      title="Produksjon"
      efficiencyLabel={<>1 våpen / 4 timer</>}
      unitNoun={{ singular: "våpen", plural: "våpen" }}
      pickerTitle="Velg våpen"
      selectButtonAria="Velg våpen"
      items={Weapons as FactoryItem[]}
      getItemById={(id) => getItemById(id)}
      selectionsPath="activeFactory.weaponSelections"
      fallbackItemId="iw0001"
      slotCount={2}
      slotDurationMs={FOUR_HOURS_MS}
      resetSelectionsOnClaim={true}
      onGrant={async (characterId, entries) => {
        // Weapons are individual items written as documents
        const batch = writeBatch(db);
        for (const { itemId, qty } of entries) {
          for (let i = 0; i < qty; i++) {
            const item = getItemById(itemId) || getItemById("iw0001");
            const ref = doc(collection(db, "Characters", characterId, "items"));
            batch.set(ref, { ...item, aquiredAt: serverTimestamp() });
          }
        }
        await batch.commit();
      }}
      processing={processing}
      onSetMessage={onSetMessage}
      onSetMessageType={onSetMessageType}
      renderCenterPreview={(it) => (
        <ItemTile
          name={it.name}
          img={it.img || ""}
          tier={it.tier || 1}
          size="small"
        />
      )}
      renderPickerItem={(w) => (
        <>
          <ItemTile name={w.name} tier={w.tier || 1} img={w.img || ""} />
          <div className="flex flex-col justify-center leading-5">
            <Item name={w.name} tier={w.tier} />
            <p className="text-sm">
              Verdi:{" "}
              <strong className="text-neutral-200">
                <i className="fa-solid fa-dollar-sign" /> {w.value}
              </strong>
            </p>
            <p className="text-sm">
              Skade: <strong className="text-neutral-200">{w.attack}</strong>
            </p>
          </div>
        </>
      )}
    />
  );
};

export default WeaponFactory;
