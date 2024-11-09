// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";

// React
import { useState, useEffect } from "react";

// Firebase
import { useNavigate } from "react-router-dom";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";

// Functions
import {
  attemptReward,
  increaseHeat,
  arrest,
} from "../../Functions/RewardFunctions";

const StreetCrime = () => {
  const { character } = useCharacter();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const { cooldowns, startCooldown, fetchCooldown } = useCooldown();

  const [selectedCrime, setSelectedCrime] = useState<string>(
    localStorage.getItem("selectedCrime") || "Lommetyveri"
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.activeCharacter && cooldowns["crime"] === undefined) {
      // Fetch cooldown only if it hasn't been fetched yet
      fetchCooldown("crime", 90, userData.activeCharacter);
    }
  }, [userData, navigate, cooldowns, fetchCooldown]);

  // Save selectedCrime to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("selectedCrime", selectedCrime);
  }, [selectedCrime]);

  // Function for comitting a crime
  const handleClick = async () => {
    if (cooldowns["crime"] > 0) {
      setMessage("Du må vente før du kan utføre en kriminell handling.");
      setMessageType("warning");
      return;
    }

    if (character && selectedCrime) {
      const crime = crimes.find((c) => c.name === selectedCrime);
      if (crime) {
        await attemptReward({
          character,
          activeCharacter: userData.activeCharacter,
          xpReward: crime.xpReward, // XP reward for the crime
          moneyReward: crime.moneyReward || 0, // Optional money reward for the crime
          successMessage: `Du utførte ${crime.name}.`,
          failureMessage: `Du prøvde å utføre ${crime.name}, men feilet. Bedre lykke neste gang!`,
          successRate: crime.successRate,
          setMessage,
          setMessageType,
        });

        increaseHeat(character, character.id, 1);

        // Start the cooldown after a crime
        startCooldown(90, "crime", userData.activeCharacter);

        const jailChance = character.stats.heat;
        if (character.stats.heat >= 50 || Math.random() * 100 < jailChance) {
          // Player failed jail check, arrest them
          arrest(character);
          setMessage("Handlingen feilet, og du ble arrestert!");
          setMessageType("failure");
          return;
        }
      }
    } else {
      setMessage("Du må velge en handling!");
      setMessageType("info");
    }
  };

  // Crime options array
  const crimes = [
    {
      id: "Lommetyveri",
      name: "Lommetyveri",
      successRate: 0.9,
      xpReward: 3,
      moneyReward: 50,
    },
    {
      id: "Herverk",
      name: "Herverk",
      successRate: 0.85,
      xpReward: 4,
      moneyReward: 200,
    },
    {
      id: "verdisaker",
      name: "Stjel verdisaker",
      successRate: 0.8,
      xpReward: 5,
      moneyReward: 800,
    },
    {
      id: "butikk",
      name: "Ran butikk",
      successRate: 0.75,
      xpReward: 6,
      moneyReward: 3200,
    },
  ];

  if (character?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

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

      <H2>Hva vil du gjøre?</H2>
      <ul className="flex gap-2 flex-wrap mb-4">
        {crimes.map((crime) => (
          <li
            key={crime.id}
            onClick={() => setSelectedCrime(crime.name)}
            className={
              "border px-4 py-2 flex-1 flex-grow min-w-[max-content] text-center cursor-pointer " +
              (selectedCrime === crime.name
                ? "bg-neutral-900 border-neutral-600"
                : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
            }
          >
            <p className={selectedCrime === crime.name ? "text-white" : ""}>
              {crime.name}
            </p>
            <p className="text-neutral-100 font-bold">
              {crime.successRate * 100} %
            </p>
          </li>
        ))}
      </ul>

      <Button onClick={handleClick}>Utfør handling</Button>
    </Main>
  );
};

export default StreetCrime;
