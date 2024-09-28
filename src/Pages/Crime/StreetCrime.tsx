import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import CrimeBox from "../../components/CrimeBox";
import InfoBox from "../../components/InfoBox";

import { useState } from "react";

const StreetCrime = () => {
  const [selectedCrime, setSelectedCrime] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  function handleClick() {
    if (selectedCrime) {
      setMessage(`You committed ${selectedCrime} and earned some money!`);
      setMessageType("success");
    } else {
      setMessage("No crime selected! Please select a crime first.");
      setMessageType("warning");
    }
  }

  // Crime options array
  const crimes = [
    {
      id: "pickpocket",
      name: "Pickpocket",
      description: "Steal from a stranger",
      img: "src\\assets\\PickpocketBw.png",
    },
    {
      id: "vandalism",
      name: "Vandalism",
      description: "Ruin something for money",
      img: "src\\assets\\VandalismBw.png",
    },
    {
      id: "protectionRacket",
      name: "Protection Racket",
      description: "Offer protection to a venue",
      img: "src\\assets\\ProtectionRacketBw.png",
    },
    {
      id: "streetRacing",
      name: "Street Racing",
      description: "Compete in a street race",
      img: "src\\assets\\StreetRacingBw.png",
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
            {crime.description}
          </CrimeBox>
        ))}
      </div>
      <Button onClick={handleClick}>Commit Crime</Button>
    </section>
  );
};

export default StreetCrime;
