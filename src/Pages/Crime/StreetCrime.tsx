// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

// React
import { useState, useEffect } from "react";

// Firebase
import { useNavigate } from "react-router-dom";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";

// Functions
import { attemptReward } from "../../Functions/RewardFunctions";

const StreetCrime = () => {
  const { character } = useCharacter();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const { cooldowns, startCooldown, fetchCooldown } = useCooldown();

  const [selectedCrime, setSelectedCrime] = useState<string | null>(null);
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

  // Function for comitting a crime
  const handleClick = async () => {
    if (cooldowns["crime"] > 0) {
      setMessage("Du må vente før du kan utføre en kriminell handling.");
      setMessageType("warning");
      return;
    }

    if (selectedCrime) {
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

        // Start the cooldown after a crime
        startCooldown(90, "crime", userData.activeCharacter);
      }
    } else {
      setMessage("Du må velge en handling!");
      setMessageType("info");
    }
  };

  // Crime options array
  const crimes = [
    {
      id: "pickpocket",
      name: "Lommetyveri",
      successRate: 0.8, // 80% success rate
      xpReward: 4, // XP for success
      moneyReward: 50, // Money reward for success
    },
    {
      id: "vandalism",
      name: "Herverk",
      successRate: 0.6, // 60% success rate
      xpReward: 8, // XP for success
      moneyReward: 200, // Money reward for success
    },
    {
      id: "protectionRacket",
      name: "Stjel verdisaker",
      successRate: 0.4, // 40% success rate
      xpReward: 12, // XP for success
      moneyReward: 800, // Money reward for success
    },
    {
      id: "streetRacing",
      name: "Stjel fra butikk",
      successRate: 0.2, // 20% success rate
      xpReward: 16, // XP for success
      moneyReward: 3200, // Money reward for success
    },
  ];

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

      <Button onClick={handleClick}>Utfør kriminalitet</Button>
    </Main>
  );
};

export default StreetCrime;
