// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import CrimeBox from "../../components/CrimeBox";
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
      description: "Stjel småpenger fra en forbipasserende",
      img: "PickpocketBw.png",
      successRate: 0.8, // 80% success rate
      xpReward: 4, // XP for success
      moneyReward: 50, // Money reward for success
    },
    {
      id: "vandalism",
      name: "Herverk",
      description: "Gjør herverk for penger",
      img: "VandalismBw.png",
      successRate: 0.6, // 60% success rate
      xpReward: 8, // XP for success
      moneyReward: 200, // Money reward for success
    },
    {
      id: "protectionRacket",
      name: "Stjel verdisaker",
      description: "Utfør vektertjenester for penger",
      img: "ProtectionRacketBw.png",
      successRate: 0.4, // 40% success rate
      xpReward: 12, // XP for success
      moneyReward: 800, // Money reward for success
    },
    {
      id: "streetRacing",
      name: "Stjel fra butikk",
      description: "Stjel fra kjøpesenter",
      img: "StreetRacingBw.png",
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

      <p className="mb-4 text-stone-400 font-medium">Velg handling:</p>
      <div className="grid grid-cols-2 lg:grid-cols-[min-content_1fr] gap-2 mb-4">
        {crimes.map((crime) => (
          <CrimeBox
            heading={crime.name}
            key={crime.id}
            img={crime.img}
            onClick={() => setSelectedCrime(crime.name)}
            isSelected={selectedCrime === crime.name}
          >
            <p className="text-xs">{crime.description}</p>
            <p className="text-neutral-100 font-bold">
              {crime.successRate * 100} %
            </p>
          </CrimeBox>
        ))}
      </div>
      <Button onClick={handleClick}>Utfør kriminalitet</Button>
    </Main>
  );
};

export default StreetCrime;
