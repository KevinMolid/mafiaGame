// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";

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
    const batch = writeBatch(db);

    // Determine rewards and crime success

    const success = Math.random() < crime.successRate;

    if (success) {
      const xpReward = crime.xpReward || 0;
      const moneyReward = Math.floor(
        crime.minMoneyReward +
          Math.random() * (crime.maxMoneyReward - crime.minMoneyReward)
      );

      // Update XP, Money, and Heat in one batch
      batch.update(characterRef, {
        "stats.xp": userCharacter.stats.xp + xpReward,
        "stats.money": userCharacter.stats.money + moneyReward,
        "stats.heat": userCharacter.stats.heat + 1,
      });

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
    } else {
      // Failed
      const newHeat = userCharacter.stats.heat + 1;
      const jailChancePct = newHeat;
      const shouldJail = newHeat >= 50 || Math.random() * 100 < jailChancePct;

      if (shouldJail) {
        await arrest(userCharacter);
        setMessage("Handlingen feilet, og du ble arrestert!");
        setMessageType("failure");
      } else {
        // Failed but not jailed: just add heat
        batch.update(characterRef, {
          "stats.heat": newHeat,
        });

        setMessage(
          `Du prøvde å utføre ${crime.name}, men feilet. Bedre lykke neste gang!`
        );
        setMessageType("failure");
      }
    }

    await batch.commit();
    startCooldown("crime");
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
      <H1>Kriminalitet</H1>

      <p className="pb-2">
        Her kan du gjøre kriminelle handlinger for å tjene penger og få
        erfaring.
      </p>

      {cooldowns["crime"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {cooldowns["crime"]}
          </span>{" "}
          sekunder før du kan gjøre en kriminell handling.
        </p>
      )}

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <ul className="grid grid-cols-2 gap-2 mb-4 max-w-[500px]">
        {crimes.map((crime) => (
          <li
            key={crime.id}
            onClick={() => setSelectedCrime(crime.name)}
            className={"flex flex-1 flex-grow min-w-[max-content]"}
          >
            <button
              className={
                "relative border px-4 py-2 flex-1 flex-grow min-w-[max-content] text-center cursor-pointer " +
                (selectedCrime === crime.name
                  ? "bg-neutral-900 border-neutral-600"
                  : "bg-neutral-800 hover:bg-neutral-900 border-transparent hover:border-neutral-600")
              }
            >
              <p
                className={
                  selectedCrime == crime.name
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

              <div className="absolute top-2 right-2">
                <Button style="black" size="small-square">
                  <i className="fa-solid fa-question"></i>
                </Button>
              </div>

              {false && (
                <div className="absolute top-0 right-0 bg-neutral-900 px-4 py-2 border border-neutral-500">
                  {/* XP reward */}
                  <p className="text-neutral-200 text-sm bg-neutral-00 px-2 rounded-lg">
                    <span className="font-bold">+{crime.xpReward} XP</span>
                  </p>

                  {/* Money range */}
                  <p className="text-neutral-200 text-sm bg-neutral-00 px-2 rounded-lg">
                    <span className="font-bold">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {money(crime.minMoneyReward)} –{" "}
                      {money(crime.maxMoneyReward)}
                    </span>
                  </p>
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Button onClick={handleClick}>Utfør handling</Button>
    </Main>
  );
};

export default StreetCrime;
