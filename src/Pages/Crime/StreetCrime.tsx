// React
import { useState } from "react";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";

// Components
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import CrimeBox from "../../components/CrimeBox";
import InfoBox from "../../components/InfoBox";

// Functions
import { giveXP } from "../../Functions/XpFunctions";

const StreetCrime = () => {
  const { character, setCharacter } = useCharacter();
  const { userData } = useAuth();
  const [selectedCrime, setSelectedCrime] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  // Function for comitting a crime
  const handleClick = async () => {
    if (selectedCrime) {
      const crime = crimes.find((c) => c.name === selectedCrime);
      if (crime) {
        const success = Math.random() < crime.successRate;
        if (success) {
          // Call giveXP and update the character XP
          const updatedXP = await giveXP(
            character,
            userData.activeCharacter,
            crime.xpReward
          );

          // Update the character with the new XP
          setCharacter((prevCharacter: any) => ({
            ...prevCharacter,
            stats: {
              ...prevCharacter.stats,
              xp: updatedXP,
            },
          }));

          setMessage(
            `You successfully committed ${crime.name} and earned ${crime.xpReward} XP!`
          );
          setMessageType("success");
        } else {
          setMessage(
            `You failed to commit ${crime.name}. Better luck next time!`
          );
          setMessageType("failure");
        }
      }
    } else {
      setMessage("No crime selected! Please select a crime first.");
      setMessageType("warning");
    }
  };

  // Crime options array
  const crimes = [
    {
      id: "pickpocket",
      name: "Pickpocket",
      description: "Steal from a stranger",
      img: "src\\assets\\PickpocketBw.png",
      successRate: 0.8, // 80% success rate
      xpReward: 4, // XP for success
    },
    {
      id: "vandalism",
      name: "Vandalism",
      description: "Ruin something for money",
      img: "src\\assets\\VandalismBw.png",
      successRate: 0.6, // 60% success rate
      xpReward: 8, // XP for success
    },
    {
      id: "protectionRacket",
      name: "Protection Racket",
      description: "Offer protection to a venue",
      img: "src\\assets\\ProtectionRacketBw.png",
      successRate: 0.4, // 40% success rate
      xpReward: 12, // XP for success
    },
    {
      id: "streetRacing",
      name: "Street Racing",
      description: "Compete in a street race",
      img: "src\\assets\\StreetRacingBw.png",
      successRate: 0.2, // 20% success rate
      xpReward: 16, // XP for success
    },
  ];

  return (
    <section>
      <H1>Street Crimes</H1>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <p className="mb-4 text-stone-400 font-medium">Select Crime:</p>
      <div className="grid grid-cols-[min-content_auto] gap-2 mb-4">
        {crimes.map((crime) => (
          <CrimeBox
            heading={crime.name}
            key={crime.id}
            img={crime.img}
            onClick={() => setSelectedCrime(crime.name)}
            isSelected={selectedCrime === crime.name}
          >
            <p>{crime.description}</p>
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
