// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Item from "../../components/Typography/Item";

// Functions
import {
  rewardXp,
  increaseHeat,
  arrest,
} from "../../Functions/RewardFunctions";

// Data
import ParkingTypes from "../../Data/ParkingTypes";
import Cars from "../../Data/Cars";

// React
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

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
  tier: number;
};

// Cars by tier
const tiers: { [key: number]: Car[] } = {
  1: Cars.filter((car) => car.tier === 1),
  2: Cars.filter((car) => car.tier === 2),
  3: Cars.filter((car) => car.tier === 3),
  4: Cars.filter((car) => car.tier === 4),
  5: Cars.filter((car) => car.tier === 5),
};

// Weights for each tier
const tierWeights = [0.5, 0.3, 0.15, 0.04, 0.01];

const GTA = () => {
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");
  const { userCharacter } = useCharacter();
  const { userData } = useAuth();
  const { cooldowns, startCooldown } = useCooldown();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, [userData, navigate, cooldowns]);

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
    if (!userCharacter || !userCharacter.id) {
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
      const characterRef = doc(db, "Characters", userCharacter.id);

      // Get player's parking facility
      const facilityType =
        userCharacter.parkingFacilities?.[userCharacter.location];

      // Check if the parking facility type is valid
      if (facilityType === undefined || facilityType === 0) {
        setMessageType("warning");
        setMessage("Du har ingen parkeringsplass i denne byen.");
        return;
      }

      // Get the number of slots available in the parking facility
      const availableSlots = ParkingTypes[facilityType].slots;

      // Get the number of cars the player already has at the current location
      const currentCars = userCharacter.cars?.[userCharacter.location] || [];

      // Check if the player has available slots
      if (currentCars.length >= availableSlots) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen ledige parkeringsplasser. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className={`fa-solid fa-square-parking`}></i> Parkering
              </Link>{" "}
            </strong>
            for å oppgradere eller frigjøre plass.
          </span>
        );
        return;
        return;
      }

      // Try to steal a car (75% chance)
      if (Math.random() <= 0.75) {
        // Success: Update characters car list
        const updatedCars = [
          ...(userCharacter.cars?.[userCharacter.location] || []),
          randomCar,
        ];

        await updateDoc(characterRef, {
          [`cars.${userCharacter.location}`]: updatedCars,
        });

        rewardXp(userCharacter, 10);
        increaseHeat(userCharacter, userCharacter.id, 1);

        setMessageType("success");
        setMessage(
          <p>
            Du stjal en <Item {...randomCar} />!
          </p>
        );

        // Start the cooldown after a GTA
        startCooldown(130, "gta", userCharacter.id);
      } else {
        // GTA attempt failed
        setMessage(
          `Du prøvde å stjele en bil, men feilet. Bedre lykke neste gang!`
        );
        setMessageType("failure");

        // Start the cooldown after a GTA
        startCooldown(130, "gta", userCharacter.id);

        // Step 4: Jail chance check based on heat level
        const jailChance = userCharacter.stats.heat;
        if (
          userCharacter.stats.heat >= 50 ||
          Math.random() * 100 < jailChance
        ) {
          // Player failed jail check, arrest them
          arrest(userCharacter);
          setMessage("Du prøvde å stjele en bil, men ble arrestert!");
          setMessageType("failure");
          return;
        }
      }
    } catch (error) {
      setMessageType("failure");
      setMessage("Du fikk ikke til å stjele en bil. Prøv igjen senere.");
      console.error("Feil ved oppdatering av bil:", error);
    }
  };

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
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
