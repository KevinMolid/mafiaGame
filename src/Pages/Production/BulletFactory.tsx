// BulletFactory.tsx
import React, { ReactNode } from "react";
import FactoryCore, { FactoryItem } from "./Factory";
import ItemTile from "../../components/ItemTile";
import Item from "../../components/Typography/Item";
import { Bullets, getItemById } from "../../Data/Items";
import { grantItemsToInventory } from "../../Functions/RewardFunctions";

type Props = {
  processing?: boolean;
  onSetMessage: (m: ReactNode) => void;
  onSetMessageType: (
    t: "success" | "failure" | "important" | "warning" | "info"
  ) => void;
};

const FOUR_HOURS_MS = 1 * 60 * 1000; // your testing value

const BulletFactory: React.FC<Props> = ({
  processing,
  onSetMessage,
  onSetMessageType,
}) => {
  return (
    <FactoryCore
      title="Produksjon"
      efficiencyLabel={<>1 kule / time</>}
      unitNoun={{ singular: "kule", plural: "kuler" }}
      pickerTitle="Velg kule"
      selectButtonAria="Velg kule"
      items={Bullets as FactoryItem[]}
      getItemById={(id) => getItemById(id)}
      selectionsPath="activeFactory.bulletSelections"
      fallbackItemId="ib0001"
      slotCount={2}
      slotDurationMs={FOUR_HOURS_MS}
      resetSelectionsOnClaim={true}
      onGrant={async (characterId, entries) => {
        // Bullets are stacked items in inventory
        await grantItemsToInventory(characterId, entries);
      }}
      processing={processing}
      onSetMessage={onSetMessage}
      onSetMessageType={onSetMessageType}
      // Small preview inside ring
      renderCenterPreview={(it) => (
        <ItemTile
          name={it.name}
          img={it.img || ""}
          tier={it.tier || 1}
          size="small"
        />
      )}
      // Picker rows with price/attack like your current UI
      renderPickerItem={(b) => (
        <>
          <ItemTile name={b.name} tier={b.tier || 1} img={b.img || ""} />
          <div className="flex flex-col justify-center leading-5">
            <Item name={b.name} tier={b.tier} />
            <p className="text-sm">
              Verdi:{" "}
              <strong className="text-neutral-200">
                <i className="fa-solid fa-dollar-sign" /> {b.value}
              </strong>
            </p>
            <p className="text-sm">
              Skade: <strong className="text-neutral-200">{b.attack}</strong>
            </p>
          </div>
        </>
      )}
    />
  );
};

export default BulletFactory;
