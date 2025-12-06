import { useState, ReactNode } from "react";

import H2 from "./Typography/H2";
import H3 from "./Typography/H3";

import d1 from "/images/boxes/Diamonds.png";
import d2 from "/images/boxes/Diamonds2.png";
import d3 from "/images/boxes/Diamonds3.png";

import Button from "./Button";
import InfoBox from "../components/InfoBox";

import { useCharacter } from "../CharacterContext";
import { applyStatRewards } from "../Functions/RewardFunctions";

const Diamonds = () => {
  const { userCharacter } = useCharacter();

  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");
  const [isBuying, setIsBuying] = useState(false);

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

  return (
    <>
      <H2>Diamanter</H2>
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

      <ul className="flex gap-4">
        <li>
          <div className="flex flex-col justify-center items-center text-center gap-1 bg-neutral-950 py-4 rounded-xl">
            <H3>Liten håndfull</H3>
            <img src={d1} className="w-52 h-28 object-cover" alt="Diamonds" />
            <p className="font-semibold text-neutral-200 text-xl">
              <i className="fa-solid fa-gem" /> 150
            </p>
            <p className="text-lg mb-2">55 kr</p>
            <Button onClick={() => handleBuy(150)} disabled={isBuying}>
              Kjøp
            </Button>
          </div>
        </li>

        <li>
          <div className="flex flex-col justify-center items-center text-center gap-1 bg-neutral-950 py-4 rounded-xl">
            <H3>Stor håndfull</H3>
            <img src={d2} className="w-52 h-28 object-cover" alt="Diamonds" />
            <p className="font-semibold text-neutral-200 text-xl">
              <i className="fa-solid fa-gem" /> 450
            </p>
            <p className="text-lg mb-2">129 kr</p>
            <Button onClick={() => handleBuy(450)} disabled={isBuying}>
              Kjøp
            </Button>
          </div>
        </li>

        <li>
          <div className="flex flex-col justify-center items-center text-center gap-1 bg-neutral-950 py-4 rounded-xl">
            <H3>Bøttevis</H3>
            <img src={d3} className="w-52 h-28 object-cover" alt="Diamonds" />
            <p className="font-semibold text-neutral-200 text-xl">
              <i className="fa-solid fa-gem" /> 1200
            </p>
            <p className="text-lg mb-2">299 kr</p>
            <Button onClick={() => handleBuy(1200)} disabled={isBuying}>
              Kjøp
            </Button>
          </div>
        </li>
      </ul>
    </>
  );
};

export default Diamonds;
