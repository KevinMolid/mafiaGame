import { useState, ReactNode } from "react";
import H2 from "./Typography/H2";
import H3 from "./Typography/H3";

import d1 from "/images/boxes/d1.png";
import d2 from "/images/boxes/d2.png";
import d3 from "/images/boxes/d3.png";

import Button from "./Button";
import InfoBox from "../components/InfoBox";
import ItemTile from "./ItemTile";

import { useCharacter } from "../CharacterContext";
import {
  applyStatRewards,
  grantItemToInventory,
} from "../Functions/RewardFunctions";
import { Megaphones } from "../Data/Items";

const MEGAPHONE_COST = 5; // diamonds

const Diamonds = () => {
  const { userCharacter } = useCharacter();

  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");
  const [isBuying, setIsBuying] = useState(false);
  const [isBuyingMegaphone, setIsBuyingMegaphone] = useState(false); // <--- NEW

  const megaphoneItem = Megaphones[0]; // we only have one megaphone config

  const handleBuy = async (amount: number) => {
    if (!userCharacter) {
      setMessage("Du må være innlogget for å kjøpe diamanter.");
      setMessageType("warning");
      return;
    }

    if (isBuying) return; // simple spam protection

    try {
      setIsBuying(true);

      // Uses the shared reward helper (atomic, uses increment under the hood)
      await applyStatRewards(userCharacter.id, { diamonds: amount });

      // Success message with styled diamond + amount
      setMessage(
        <>
          Du kjøpte{" "}
          <span className="font-semibold text-neutral-200">
            <i className="fa-solid fa-gem" /> {amount}
          </span>
          !
        </>
      );
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Noe gikk galt. Prøv igjen senere.");
      setMessageType("failure");
    } finally {
      setIsBuying(false);
    }
  };

  const handleBuyMegaphone = async () => {
    if (!userCharacter) {
      setMessage("Du må være innlogget for å kjøpe varer i diamantbutikken.");
      setMessageType("warning");
      return;
    }

    if (isBuyingMegaphone) return;

    const currentDiamonds = userCharacter.stats.diamonds ?? 0;
    if (currentDiamonds < MEGAPHONE_COST) {
      setMessage("Du har ikke nok diamanter til å kjøpe denne varen.");
      setMessageType("warning");
      return;
    }

    try {
      setIsBuyingMegaphone(true);

      // 1) Subtract diamonds
      await applyStatRewards(userCharacter.id, { diamonds: -MEGAPHONE_COST });

      // 2) Grant megaphone item
      await grantItemToInventory(userCharacter.id, megaphoneItem.id, 1);

      setMessage(
        <>
          Du kjøpte{" "}
          <span className="font-semibold text-neutral-200">
            {megaphoneItem.name}
          </span>{" "}
          for{" "}
          <span className="font-semibold text-neutral-200">
            <i className="fa-solid fa-gem" /> {MEGAPHONE_COST}
          </span>
          .
        </>
      );
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Noe gikk galt. Prøv igjen senere.");
      setMessageType("failure");
    } finally {
      setIsBuyingMegaphone(false);
    }
  };

  return (
    <>
      <H2>Kjøp diamanter</H2>
      <p className="mb-4">
        Her kan du kjøpe diamanter som kan brukes til å kjøpe forskjellige ting
        i spillet.
      </p>

      {/* InfoBox over kortene */}
      {message && (
        <div className="mb-4">
          <InfoBox type={messageType}>{message}</InfoBox>
        </div>
      )}

      <ul className="flex gap-4 mb-8">
        <li>
          <div className="flex flex-col justify-center items-center text-center border border-neutral-600 pt-4 pb-6">
            <H3>Liten håndfull</H3>
            <img
              src={d1}
              className="w-36 h-32 mb-2 -mt-2 mx-10 object-cover"
              alt="Diamonds"
            />
            <p className="font-semibold text-neutral-200 text-xl">
              <i className="fa-solid fa-gem" /> 50
            </p>
            <p className="text-lg mb-2">50 kr</p>
            <Button onClick={() => handleBuy(150)} disabled={isBuying}>
              Kjøp
            </Button>
          </div>
        </li>

        <li>
          <div className="flex flex-col justify-center items-center text-center border border-neutral-600 pt-4 pb-6">
            <H3>Stor håndfull</H3>
            <img
              src={d2}
              className="w-48 h-36 -mt-4 mx-4 object-cover"
              alt="Diamonds"
            />
            <p className="font-semibold text-neutral-200 text-xl">
              <i className="fa-solid fa-gem" /> 165
            </p>
            <p className="text-lg mb-2">150 kr</p>
            <Button onClick={() => handleBuy(450)} disabled={isBuying}>
              Kjøp
            </Button>
          </div>
        </li>

        <li>
          <div className="flex flex-col justify-center items-center text-center border border-neutral-600 pt-4 pb-6">
            <H3>Bøttevis</H3>
            <img
              src={d3}
              className="w-48 h-36 -mt-4 mx-4 object-cover"
              alt="Diamonds"
            />
            <p className="font-semibold text-neutral-200 text-xl">
              <i className="fa-solid fa-gem" /> 500
            </p>
            <p className="text-lg mb-2">450 kr</p>
            <Button onClick={() => handleBuy(1200)} disabled={isBuying}>
              Kjøp
            </Button>
          </div>
        </li>
      </ul>

      <H2>Diamantbutikk</H2>
      <ul>
        <li className="flex flex-col gap-1 items-center">
          <p className="text-neutral-200 font-semibold">{megaphoneItem.name}</p>
          <ItemTile
            name={megaphoneItem.name}
            img={megaphoneItem.img}
            tier={megaphoneItem.tier}
          />
          <p className="font-semibold text-neutral-200 text-xl">
            <i className="fa-solid fa-gem" /> {MEGAPHONE_COST}
          </p>
          <div className="mt-2">
            <Button onClick={handleBuyMegaphone} disabled={isBuyingMegaphone}>
              Kjøp
            </Button>
          </div>
        </li>
      </ul>
    </>
  );
};

export default Diamonds;
