// React
import { useState, useEffect } from "react";

// Firebase
import { useNavigate } from "react-router-dom";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";

// Components
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import CrimeBox from "../../components/CrimeBox";
import InfoBox from "../../components/InfoBox";

// Functions
import { attemptReward } from "../../Functions/RewardFunctions";

const StreetCrime = () => {
  const { character, setCharacter } = useCharacter();
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

    if (userData.activeCharacter) {
      // Fetch cooldown when the component mounts
      fetchCooldown("crime", 90, userData.activeCharacter);
    }
  }, [userData, navigate, fetchCooldown]);

  // Function for comitting a crime
  const handleClick = async () => {
    if (cooldowns["crime"] > 0) {
      setMessage("You must wait before committing another crime.");
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
          successMessage: `You successfully committed ${crime.name}`,
          failureMessage: `You failed to commit ${crime.name}. Better luck next time!`,
          successRate: crime.successRate,
          setCharacter,
          setMessage,
          setMessageType,
        });

        // Start the cooldown after a crime
        startCooldown(120, "crime", userData.activeCharacter);
      }
    } else {
      setMessage("No crime selected! Please select a crime first.");
      setMessageType("info");
    }
  };

  // Crime options array
  const crimes = [
    {
      id: "pickpocket",
      name: "Pickpocket",
      description: "Steal from a stranger",
      img: "PickpocketBw.png",
      successRate: 0.8, // 80% success rate
      xpReward: 4, // XP for success
      moneyReward: 50, // Money reward for success
    },
    {
      id: "vandalism",
      name: "Vandalism",
      description: "Ruin something for money",
      img: "VandalismBw.png",
      successRate: 0.6, // 60% success rate
      xpReward: 8, // XP for success
      moneyReward: 200, // Money reward for success
    },
    {
      id: "protectionRacket",
      name: "Protection Racket",
      description: "Offer protection to a venue",
      img: "ProtectionRacketBw.png",
      successRate: 0.4, // 40% success rate
      xpReward: 12, // XP for success
      moneyReward: 800, // Money reward for success
    },
    {
      id: "streetRacing",
      name: "Street Racing",
      description: "Compete in a street race",
      img: "StreetRacingBw.png",
      successRate: 0.2, // 20% success rate
      xpReward: 16, // XP for success
      moneyReward: 3200, // Money reward for success
    },
  ];

  return (
    <section>
      <H1>Street Crimes</H1>

      {cooldowns["crime"] > 0 && (
        <p className="mb-4 text-stone-400">
          You can commit another crime in{" "}
          <span className="font-bold text-white">{cooldowns["crime"]}</span>{" "}
          seconds.
        </p>
      )}

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <p className="mb-4 text-stone-400 font-medium">Select Crime:</p>
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
      <Button onClick={handleClick}>Commit Crime</Button>
    </section>
  );
};

export default StreetCrime;
