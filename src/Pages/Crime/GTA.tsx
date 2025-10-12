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

import { getCarByName, getCarByKey } from "../../Data/Cars";

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
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getCountFromServer,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import type { Car } from "../../Interfaces/Types";

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
  const { jailRemainingSeconds } = useCooldown();
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
    const randomCar =
      selectedTierCars[getRandom(0, selectedTierCars.length - 1)];

    try {
      // 1) Capacity in current city
      const facilityType =
        userCharacter.parkingFacilities?.[userCharacter.location];
      if (facilityType === undefined || facilityType === 0) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen parkeringsplass i denne byen. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className="fa-solid fa-square-parking"></i> Parkering
              </Link>
            </strong>{" "}
            for å kjøpe parkering.
          </span>
        );
        return;
      }
      const availableSlots = ParkingTypes[facilityType].slots;

      // Count cars in this city under Characters/{id}/cars
      const carsCol = collection(db, "Characters", userCharacter.id, "cars");
      const qCity = query(carsCol, where("city", "==", userCharacter.location));
      const countSnap = await getCountFromServer(qCity);
      const currentCount = countSnap.data().count || 0;

      if (currentCount >= availableSlots) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen ledige parkeringsplasser. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className="fa-solid fa-square-parking"></i> Parkering
              </Link>
            </strong>{" "}
            for å oppgradere eller frigjøre plass.
          </span>
        );
        return;
      }

      // 2) Attempt theft (75% success)
      if (Math.random() <= 0.75) {
        const carDoc = {
          modelKey: randomCar.key,
          name: randomCar.name,
          value: randomCar.value,
          hp: randomCar.hp,
          tier: randomCar.tier,
          isElectric: !!randomCar.isElectric,
          city: userCharacter.location,
          acquiredAt: serverTimestamp(),
        };

        await addDoc(carsCol, carDoc);

        rewardXp(userCharacter, 10);
        increaseHeat(userCharacter, userCharacter.id, 1);

        const catalog = randomCar.key
          ? getCarByKey(randomCar.key)
          : getCarByName(randomCar.name);

        setMessageType("success");
        setMessage(
          <div>
            Du stjal en{" "}
            <Item
              name={randomCar.name}
              tier={randomCar.tier}
              tooltipImg={catalog?.img && catalog.img}
              tooltipContent={
                <div>
                  <p>
                    Effekt:{" "}
                    <strong className="text-neutral-200">
                      {randomCar.hp} hk
                    </strong>
                  </p>
                  <p>
                    Verdi:{" "}
                    <strong className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {randomCar.value.toLocaleString("nb-NO")}
                    </strong>
                  </p>
                </div>
              }
            />
            !
          </div>
        );

        startCooldown("gta");
      } else {
        setMessage(
          "Du prøvde å stjele en bil, men feilet. Bedre lykke neste gang!"
        );
        setMessageType("failure");
        startCooldown("gta");

        increaseHeat(userCharacter, userCharacter.id, 1);
        const newHeat = userCharacter.stats.heat + 1;
        const jailChance = newHeat;

        if (newHeat >= 50 || Math.random() * 100 < jailChance) {
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

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
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
