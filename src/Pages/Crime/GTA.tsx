import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import { useState } from "react";

import Cars from "../../Data/Cars";

import { useCharacter } from "../../CharacterContext";

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  const { character, setCharacter } = useCharacter();

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

  const stealCar = async () => {
    if (!character) {
      setMessageType("failure");
      setMessage("Character not loaded.");
      return;
    }

    const tier = getRandomTier();
    const selectedTierCars = tiers[tier];

    // Randomly select a car from the selected tier
    const randomCar =
      selectedTierCars[getRandom(0, selectedTierCars.length - 1)];

    try {
      const characterRef = doc(db, "Characters", character.id);

      // Update the character's cars list
      const updatedCars = [
        ...(character.cars?.[character.location] || []), // Get existing cars in current location
        randomCar, // Add the stolen car
      ];

      await updateDoc(characterRef, {
        [`cars.${character.location}`]: updatedCars, // Update cars for the current location
      });

      // Update the local character state with the new car
      setCharacter({
        ...character, // Spread the current character data
        cars: {
          ...character.cars,
          [character.location]: updatedCars, // Update cars for the current location
        },
      });

      setMessageType("success");
      setMessage(`You stole a ${randomCar.name}!`);
    } catch (error) {
      setMessageType("failure");
      setMessage("Failed to steal the car. Try again.");
      console.error("Error updating car:", error);
    }
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
