import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import { useState } from "react";

import Cars from "../../Data/Cars";

type Car = {
  name: string;
  value: number;
  hp: number;
};

// Cars by tier
const tiers: { [key: number]: Car[] } = {
  1: Cars.filter((car) => car.value <= 42000), // Tier 1: up to 42,000
  2: Cars.filter((car) => car.value > 42000 && car.value <= 95000), // Tier 2: 42,001 - 95,000
  3: Cars.filter((car) => car.value > 95000 && car.value <= 200000), // Tier 3: 95,001 - 200,000
  4: Cars.filter((car) => car.value > 200000), // Tier 4: above 200,000
};

// Weights for each tier
const tierWeights = [0.6, 0.25, 0.1, 0.05];

const GTA = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info"
  >("info");

  // Helper function to get random number in range
  const getRandom = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // Function to pick a tier based on weights
  const getRandomTier = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < tierWeights.length; i++) {
      cumulative += tierWeights[i];
      if (rand < cumulative) {
        return i + 1; // Return tier number
      }
    }
    return 1; // Fallback to Tier 1
  };

  const stealCar = () => {
    const tier = getRandomTier();
    const selectedTierCars = tiers[tier];

    // Randomly select a car from the selected tier
    const randomCar =
      selectedTierCars[getRandom(0, selectedTierCars.length - 1)];

    setMessageType("success");
    setMessage(`You stole a ${randomCar.name}!`);
  };

  return (
    <div>
      <H1>Grand Theft Auto</H1>
      <p className="pb-2">
        Steal a car from the street, from a random player or from a player of
        your choosing.
      </p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <Button onClick={stealCar}>Commit Theft</Button>
    </div>
  );
};

export default GTA;
