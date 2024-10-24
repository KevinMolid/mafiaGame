import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import Box from "../../components/Box";
import InfoBox from "../../components/InfoBox";

import { useState, useEffect, useMemo } from "react";

import { useCharacter } from "../../CharacterContext";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../../firebaseConfig";

import ParkingTypes from "../../Data/ParkingTypes";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define the Car type according to your existing car structure
type Car = {
  name: string;
  hp: number;
  value: number;
};

const Parking = () => {
  const { character } = useCharacter();
  const [parking, setParking] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [upgrading, setUpgrading] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info"
  >("info");

  if (!character) {
    return null;
  }

  useEffect(() => {
    if (character?.parkingFacilities?.[character.location]) {
      const parkingSlots = character.parkingFacilities[character.location];
      setParking(parkingSlots);
    } else {
      setParking(0);
    }
  }, [character]);

  const updateParking = async (
    characterId: string,
    city: string,
    newParkingIndex: number
  ) => {
    const characterRef = doc(db, "Characters", characterId);
    const upgradeName = ParkingTypes[newParkingIndex].name;
    const upgradePrice = ParkingTypes[newParkingIndex].price;

    // Check if the character has enough money
    if (character.stats.money < upgradePrice) {
      setMessageType("failure");
      setMessage(`Du har ikke nok penger til å oppgradere parkering.`);
      return;
    }

    // Subtract the upgrade cost from the user's money
    const newMoney = character.stats.money - upgradePrice;

    try {
      await updateDoc(characterRef, {
        [`parkingFacilities.${city}`]: newParkingIndex,
        [`stats.money`]: newMoney,
      });

      setParking(newParkingIndex);
      setMessageType("success");
      setMessage(
        `Du kjøpte ${upgradeName} for $${upgradePrice.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Feil ved oppdatering av parkering: ", error);
    }
  };

  const canUpgrade = parking !== null && parking < ParkingTypes.length - 1;

  // Calculate the total value of cars in the current location
  const totalValue = useMemo(() => {
    return (
      character.cars?.[character.location]?.reduce(
        (acc: number, car: any) => acc + car.value,
        0
      ) || 0
    );
  }, [character]);

  // Function to sell a car
  const sellCar = async (carIndex: number) => {
    const carToSell = character.cars[character.location][carIndex];
    const updatedCars: Car[] = character.cars[character.location].filter(
      (_: any, index: number) => index !== carIndex
    );
    const newMoney = character.stats.money + carToSell.value;

    const characterRef = doc(db, "Characters", character.id);

    try {
      await updateDoc(characterRef, {
        [`cars.${character.location}`]: updatedCars,
        [`stats.money`]: newMoney,
      });

      setMessageType("success");
      setMessage(
        `Solgte en ${carToSell.name} for $${carToSell.value.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Feil ved salg av bil: ", error);
      setMessageType("failure");
      setMessage(`En ukjent feil ddkket opp ved salg av bil.`);
    }
  };

  // Function to sell all cars
  const sellAllCars = async () => {
    const carsToSell = character.cars[character.location] || [];
    if (carsToSell.length === 0) {
      setMessageType("info");
      setMessage("Du har ingen biler å selge.");
      return;
    }

    const characterRef = doc(db, "Characters", character.id);
    const updatedCars: Car[] = [];
    let totalSoldValue = 0;

    for (const car of carsToSell) {
      totalSoldValue += car.value;
    }

    try {
      await updateDoc(characterRef, {
        [`cars.${character.location}`]: updatedCars,
        [`stats.money`]: character.stats.money + totalSoldValue,
      });

      setMessageType("success");
      setMessage(
        `Du solgte alle bilene dine for $${totalSoldValue.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Feil ved salg av biler: ", error);
      setMessageType("failure");
      setMessage(`En ukjent feil ddkket opp ved salg av biler.`);
    }
  };

  const toggleUpgrading = () => {
    setUpgrading(!upgrading);
  };

  return (
    <Main>
      <div className="flex flex-col gap-4">
        <div>
          <H1>Parkering</H1>
          <p>
            Dette er en oversikt over parkering og alle bilene du har i{" "}
            <strong className="text-neutral-200">{character?.location}</strong>.
          </p>
        </div>

        {/* Infobox */}
        {message && <InfoBox type={messageType}>{message}</InfoBox>}

        {/* Parking facility */}
        <Box>
          <div className="flex items-baseline gap-4">
            <H2>
              {parking !== null ? ParkingTypes[parking].name : "Loading..."}
            </H2>
            <button className="hover:text-white" onClick={toggleUpgrading}>
              <strong>Oppgrader </strong>
              {upgrading ? (
                <i className="fa-solid fa-caret-up"></i>
              ) : (
                <i className="fa-solid fa-caret-down"></i>
              )}
            </button>
          </div>

          <div className="flex gap-4">
            {/* Show loading if parking is still null */}
            <p>
              Plasser:{" "}
              <strong className="text-white">
                {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
              </strong>
            </p>
            <p>
              Sikkerhet:{" "}
              <strong className="text-white">
                {parking !== null
                  ? ParkingTypes[parking].security
                  : "Loading..."}
                %
              </strong>
            </p>
          </div>
        </Box>

        {canUpgrade && upgrading && (
          <Box>
            <H2>Oppgrader parkering?</H2>
            <strong className="text-yellow-400">
              ${ParkingTypes[parking + 1].price.toLocaleString()}
            </strong>
            <div className="flex gap-8">
              <div>
                <H3>Plasser</H3>
                <p>
                  <strong className="text-white">
                    {ParkingTypes[parking].slots}{" "}
                  </strong>
                  <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
                  <strong className="text-white">
                    {" "}
                    {ParkingTypes[parking + 1].slots}
                  </strong>
                </p>
              </div>

              <div>
                <H3>Sikkerhet</H3>
                <p>
                  <strong className="text-white">
                    {ParkingTypes[parking].security}%{" "}
                  </strong>
                  <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
                  <strong className="text-white">
                    {" "}
                    {ParkingTypes[parking + 1].security}%
                  </strong>
                </p>
              </div>

              <div className="flex gap-2 justify-end items-end">
                <Button onClick={toggleUpgrading} style="secondary">
                  Lukk
                </Button>
                <Button
                  onClick={() =>
                    parking !== null &&
                    updateParking(character.id, character.location, parking + 1)
                  }
                >
                  Kjøp oppgradering
                </Button>
              </div>
            </div>
          </Box>
        )}

        <table className="w-full table-auto border border-collapse text-left">
          <thead>
            <tr className="border border-neutral-700 bg-neutral-950 text-stone-200">
              <th className="px-2 py-1">Bil</th>
              <th className="px-2 py-1">Motorkraft</th>
              <th className="px-2 py-1">Verdi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {character.cars?.[character.location]?.length ? (
              character.cars[character.location].map(
                (car: any, index: number) => {
                  return (
                    <tr
                      className="border bg-neutral-800 border-neutral-700"
                      key={index}
                    >
                      <td className="px-2 py-1">{car.name}</td>
                      <td className="px-2 py-1">{car.hp} hp</td>
                      <td className="px-2 py-1">
                        {"$" + car.value.toLocaleString()}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => sellCar(index)}
                          className="font-medium hover:text-neutral-200"
                        >
                          Selg bil
                        </button>
                      </td>
                    </tr>
                  );
                }
              )
            ) : (
              <tr className="border bg-neutral-800 border-neutral-700">
                <td colSpan={4} className="px-2 py-1">
                  Du har ingen biler.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border border-neutral-700 bg-neutral-950 text-stone-200">
              <td className="px-2 py-1"></td>
              <td className="px-2 py-1">Total verdi</td>
              <td className="px-2 py-1">${totalValue.toLocaleString()}</td>
              <td className="px-2 py-1">
                <button
                  onClick={sellAllCars}
                  className="font-medium hover:text-neutral-200"
                >
                  Selg alle
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
        <p>
          <strong className="text-white">
            {character.cars?.[character.location]?.length || 0}
          </strong>{" "}
          av{" "}
          <strong className="text-white">
            {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
          </strong>{" "}
          plasser brukt.
        </p>
      </div>
    </Main>
  );
};

export default Parking;
