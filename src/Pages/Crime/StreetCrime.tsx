// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H4 from "../../components/Typography/H4";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Box from "../../components/Box";

// functions
import { compactMmSs } from "../../Functions/TimeFunctions";

import { arrest } from "../../Functions/RewardFunctions";

// React
import { useState, useEffect, ReactNode } from "react";

// Firebase
import { useNavigate } from "react-router-dom";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";

import { getFirestore, doc, writeBatch } from "firebase/firestore";

const db = getFirestore();

const StreetCrime = () => {
  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const { cooldowns, startCooldown } = useCooldown();

  const [selectedCrime, setSelectedCrime] = useState<string>(
    localStorage.getItem("selectedCrime") || "Lommetyveri"
  );
  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");
  const [helpActive, setHelpActive] = useState<boolean>(false);

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, [userData, navigate]);

  // Save selectedCrime to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("selectedCrime", selectedCrime);
  }, [selectedCrime]);

  // Function for comitting a crime
  const handleClick = async () => {
    if (cooldowns["crime"] > 0) {
      setMessageType("warning");
      setMessage("Du må vente før du kan utføre en kriminell handling.");
      return;
    }

    if (!userCharacter || !selectedCrime) {
      setMessageType("warning");
      setMessage("Du må velge en handling!");
      return;
    }

    const crime = crimes.find((c) => c.name === selectedCrime);
    if (!crime) return;

    const characterRef = doc(db, "Characters", userCharacter.id);

    // Determine success/failure
    const success = Math.random() < crime.successRate;

    if (success) {
      // Rewards
      const xpReward = crime.xpReward || 0;
      const moneyReward = Math.floor(
        crime.minMoneyReward +
          Math.random() * (crime.maxMoneyReward - crime.minMoneyReward)
      );

      // Clamp heat to 50 when incrementing
      const newHeat = Math.min(50, (userCharacter.stats.heat || 0) + 1);

      // Commit only the success path writes
      const batch = writeBatch(db);
      batch.update(characterRef, {
        "stats.xp": (userCharacter.stats.xp || 0) + xpReward,
        "stats.money": (userCharacter.stats.money || 0) + moneyReward,
        "stats.heat": newHeat,
      });
      await batch.commit();

      setMessage(
        <>
          Du utførte <strong>{crime.name}</strong>.
          {moneyReward && xpReward ? (
            <>
              {" "}
              Du fikk{" "}
              <strong>
                <i className="fa-solid fa-dollar-sign"></i> {money(moneyReward)}
              </strong>{" "}
              og <strong>{xpReward} XP</strong>!
            </>
          ) : xpReward ? (
            <>
              {" "}
              Du fikk <strong>{xpReward} XP</strong>!
            </>
          ) : (
            <>
              {" "}
              Du fikk{" "}
              <strong>
                <i className="fa-solid fa-dollar-sign"></i> {money(moneyReward)}
              </strong>
              !
            </>
          )}
        </>
      );
      setMessageType("success");
      startCooldown("crime");
      return;
    }

    // Failure path
    const newHeat = Math.min(50, (userCharacter.stats.heat || 0) + 1);
    const jailChancePct = newHeat;
    const shouldJail = Math.random() * 100 < jailChancePct;

    if (shouldJail) {
      // IMPORTANT: do NOT commit any pending batch after arrest
      await arrest(userCharacter);
      setMessage("Handlingen feilet, og du ble arrestert!");
      setMessageType("failure");
      startCooldown("crime");
      return;
    } else {
      // Failed but not jailed: just add (clamped) heat
      const batch = writeBatch(db);
      batch.update(characterRef, { "stats.heat": newHeat });
      await batch.commit();

      setMessage(
        `Du prøvde å utføre ${crime.name}, men feilet. Bedre lykke neste gang!`
      );
      setMessageType("failure");
      startCooldown("crime");
      return;
    }
  };

  // Crime options array
  const crimes = [
    {
      id: "Lommetyveri",
      name: "Lommetyveri",
      successRate: 0.9,
      xpReward: 3,
      minMoneyReward: 10,
      maxMoneyReward: 500,
    },
    {
      id: "Herverk",
      name: "Herverk",
      successRate: 0.85,
      xpReward: 4,
      minMoneyReward: 20,
      maxMoneyReward: 1000,
    },
    {
      id: "verdisaker",
      name: "Stjel verdisaker",
      successRate: 0.8,
      xpReward: 5,
      minMoneyReward: 80,
      maxMoneyReward: 8000,
    },
    {
      id: "butikk",
      name: "Ran butikk",
      successRate: 0.75,
      xpReward: 6,
      minMoneyReward: 160,
      maxMoneyReward: 16000,
    },
  ];

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  // Helpers
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const money = (n: number) => n.toLocaleString("nb-NO");

  return (
    <Main>
      <div className="flex items-baseline justify-between gap-4">
        <H1>Kriminalitet</H1>
        {helpActive ? (
          <Button
            size="small-square"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small-square"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>

      <p className="pb-2">
        Her kan du gjøre kriminelle handlinger for å tjene penger og få
        erfaring.
      </p>

      {/* Info box */}
      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm flex gap-x-8 flex-wrap">
            <article>
              <H4>Hvordan utføre kriminalitet</H4>
              <p className="mb-2">
                Velg ønsket kriminell handling, og trykk på "Utfør handling". Du
                kan velge mellom "Lommetyveri", "Herverk", "Stjel verdisaker"
                eller "Ran butikk".
              </p>
              <H4>Sjanse for suksess og belønning</H4>
              {crimes.map((crime) => (
                <p>
                  {crime.name}:{" "}
                  <strong className="text-neutral-200">
                    +{crime.xpReward} XP
                  </strong>{" "}
                  og{" "}
                  <strong className="text-neutral-200">
                    {crime.minMoneyReward} - {crime.maxMoneyReward}
                  </strong>
                </p>
              ))}
              <p className="mb-4"></p>
            </article>
          </Box>
        </div>
      )}

      {cooldowns["crime"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {compactMmSs(cooldowns["crime"])}
          </span>{" "}
          før du kan gjøre en kriminell handling.
        </p>
      )}

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <ul className="grid grid-cols-2 gap-2 mb-4 max-w-[500px]">
        {crimes.map((crime) => (
          <li
            key={crime.id}
            className="flex flex-1 flex-grow min-w-[max-content]"
          >
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selectedCrime === crime.name}
              onClick={() => setSelectedCrime(crime.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCrime(crime.name);
                }
              }}
              className={
                "relative border px-4 py-2 flex-1 flex-grow min-w-[max-content] text-center cursor-pointer " +
                (selectedCrime === crime.name
                  ? "bg-neutral-900 border-neutral-600"
                  : "bg-neutral-800 hover:bg-neutral-900 border-transparent hover:border-neutral-600")
              }
            >
              <p
                className={
                  selectedCrime === crime.name
                    ? "text-sand-400 font-bold"
                    : "font-bold"
                }
              >
                {crime.name}
              </p>

              {/* Chance of success */}
              <p className="text-neutral-200 text-xl font-bold">
                {pct(crime.successRate)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Button onClick={handleClick}>Utfør handling</Button>
    </Main>
  );
};

export default StreetCrime;
