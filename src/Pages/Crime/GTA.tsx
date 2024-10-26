// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";

// Functions
import { rewardXp, increaseHeat } from "../../Functions/RewardFunctions";

// Data
import ParkingTypes from "../../Data/ParkingTypes";
import Cars from "../../Data/Cars";

// React
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Context
import { useAuth } from "../../AuthContext";
import { useCharacter } from "../../CharacterContext";
import { useCooldown } from "../../CooldownContext";

// Firebase
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
    "success" | "failure" | "info" | "warning"
  >("info");
  const { character } = useCharacter();
  const { userData } = useAuth();
  const { cooldowns, startCooldown, fetchCooldown } = useCooldown();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.activeCharacter && cooldowns["gta"] === undefined) {
      // Fetch cooldown only if it hasn't been fetched yet
      fetchCooldown("gta", 240, userData.activeCharacter);
    }
  }, [userData, navigate, cooldowns, fetchCooldown]);

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

  // Function for stealing a random car
  const stealCar = async () => {
    if (!character || !character.id) {
      setMessageType("failure");
      setMessage("Brukeren er ikke lastet opp.");
      return;
    }

    if (cooldowns["gta"] > 0) {
      setMessageType("warning");
      setMessage("Du må vente før du kan stjele en bil.");
      return;
    }

    const tier = getRandomTier();
    const selectedTierCars = tiers[tier];

    // Randomly select a car from the selected tier
    const randomCar =
      selectedTierCars[getRandom(0, selectedTierCars.length - 1)];

    try {
      const characterRef = doc(db, "Characters", character.id);

      // Get player's parking facility
      const facilityType = character.parkingFacilities?.[character.location];

      // Check if the parking facility type is valid
      if (facilityType === undefined || facilityType === 0) {
        setMessageType("failure");
        setMessage("Du har ingen parkeringsplass i denne byen.");
        return;
      }

      // Get the number of slots available in the parking facility
      const availableSlots = ParkingTypes[facilityType].slots;

      // Get the number of cars the player already has at the current location
      const currentCars = character.cars?.[character.location] || [];

      // Check if the player has available slots
      if (currentCars.length >= availableSlots) {
        setMessageType("failure");
        setMessage("Du har ingen ledige parkeringsplasser.");
        return;
      }

      // Update the character's cars list
      const updatedCars = [
        ...(character.cars?.[character.location] || []),
        randomCar,
      ];

      await updateDoc(characterRef, {
        [`cars.${character.location}`]: updatedCars,
      });

      rewardXp(character, 10);
      increaseHeat(character, character.id, 1);

      setMessageType("success");
      setMessage(`Du stjal en ${randomCar.name}!`);

      // Start the cooldown after a GTA
      startCooldown(240, "gta", character.id);
    } catch (error) {
      setMessageType("failure");
      setMessage("Du fikk ikke til å stjele en bil. Prøv igjen senere.");
      console.error("Feil ved oppdatering av bil:", error);
    }
  };

  if (character?.inJail) {
    return (
      <Main>
        <JailBox message={message} messageType={messageType} />
      </Main>
    );
  }

  return (
    <Main>
      <H1>Biltyveri</H1>

      <p className="pb-2">Her kan du stjele en bil fra gata.</p>

      {cooldowns["gta"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">{cooldowns["gta"]}</span>{" "}
          sekunder før du kan stjele en bil.
        </p>
      )}

      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <Button onClick={stealCar}>Utfør biltyveri</Button>
    </Main>
  );
};

export default GTA;
