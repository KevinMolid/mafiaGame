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
  const { character, setCharacter } = useCharacter();
  const [parking, setParking] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
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
      setMessage(`You do not have enough money to upgrade to ${upgradeName}.`);
      return;
    }

    // Subtract the upgrade cost from the user's money
    const newMoney = character.stats.money - upgradePrice;

    try {
      await updateDoc(characterRef, {
        [`parkingFacilities.${city}`]: newParkingIndex,
        [`stats.money`]: newMoney,
      });

      setCharacter((prevCharacter) =>
        prevCharacter
          ? {
              ...prevCharacter,
              parkingFacilities: {
                ...prevCharacter.parkingFacilities,
                [city]: newParkingIndex,
              },
              stats: {
                ...prevCharacter.stats,
                money: newMoney,
              },
            }
          : prevCharacter
      );

      setParking(newParkingIndex);
      setMessageType("success");
      setMessage(
        `You bought ${upgradeName} for $${upgradePrice.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Error updating parking facility: ", error);
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

      // Update the character locally
      setCharacter((prevCharacter) =>
        prevCharacter
          ? {
              ...prevCharacter,
              cars: {
                ...prevCharacter.cars,
                [character.location]: updatedCars,
              },
              stats: {
                ...prevCharacter.stats,
                money: newMoney,
              },
            }
          : prevCharacter
      );

      setMessageType("success");
      setMessage(
        `Sold a ${carToSell.name} for $${carToSell.value.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Error selling car: ", error);
      setMessageType("failure");
      setMessage(`An unknown error occured when trying to sell a car.`);
    }
  };

  // Function to sell all cars
  const sellAllCars = async () => {
    const carsToSell = character.cars[character.location] || [];
    if (carsToSell.length === 0) {
      setMessageType("info");
      setMessage("No cars to sell.");
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

      // Update the character locally
      setCharacter((prevCharacter) =>
        prevCharacter
          ? {
              ...prevCharacter,
              cars: {
                ...prevCharacter.cars,
                [character.location]: updatedCars,
              },
              stats: {
                ...prevCharacter.stats,
                money: prevCharacter.stats.money + totalSoldValue,
              },
            }
          : prevCharacter
      );

      setMessageType("success");
      setMessage(
        `Sold all cars for a total of $${totalSoldValue.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Error selling all cars: ", error);
      setMessageType("failure");
      setMessage(`An unknown error occurred when trying to sell all cars.`);
    }
  };

  return (
    <Main>
      <div className="flex flex-col gap-4">
        <div>
          <H1>{character?.location} Parking</H1>
          <p>
            This is an overview of your parking lot and all the cars you own in{" "}
            {character?.location}
          </p>
        </div>

        {/* Infobox */}
        {message && <InfoBox type={messageType}>{message}</InfoBox>}

        {/* Parking facility */}
        <Box color="slate">
          <H2>
            {parking !== null ? ParkingTypes[parking].name : "Loading..."}
          </H2>
          <div className="flex gap-4">
            {/* Show loading if parking is still null */}
            <p>
              Slots:{" "}
              <strong className="text-white">
                {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
              </strong>
            </p>
            <p>
              Security:{" "}
              <strong className="text-white">
                {parking !== null
                  ? ParkingTypes[parking].security
                  : "Loading..."}
                %
              </strong>
            </p>
          </div>
          {canUpgrade && (
            <div className="mt-2">
              <p>Next upgrade:</p>
              <Box color="slate">
                <H3>{ParkingTypes[parking + 1].name}</H3>
                <div className="grid grid-cols-2">
                  <div>
                    <p>
                      Slots: <strong>{ParkingTypes[parking].slots}</strong>{" "}
                      <i className="fa-solid fa-arrow-right-long"></i>{" "}
                      <strong className="text-green-500">
                        {ParkingTypes[parking + 1].slots}
                      </strong>
                    </p>
                    <p>
                      Security:{" "}
                      <strong>{ParkingTypes[parking].security}%</strong>{" "}
                      <i className="fa-solid fa-arrow-right-long"></i>{" "}
                      <strong className="text-green-500">
                        {ParkingTypes[parking + 1].security}%
                      </strong>
                    </p>
                    <p>
                      Price:{" "}
                      <strong className="text-yellow-400">
                        ${ParkingTypes[parking + 1].price.toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <div className="flex justify-end items-end">
                    <Button
                      onClick={() =>
                        parking !== null &&
                        updateParking(
                          character.id,
                          character.location,
                          parking + 1
                        )
                      }
                    >
                      Buy Upgrade
                    </Button>
                  </div>
                </div>
              </Box>
            </div>
          )}
        </Box>
        <table className="w-full table-auto border border-collapse text-left">
          <thead>
            <tr className="border border-neutral-700 bg-neutral-950 text-stone-200">
              <th className="px-2 py-1">Car</th>
              <th className="px-2 py-1">Power</th>
              <th className="px-2 py-1">Value</th>
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
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                }
              )
            ) : (
              <tr className="border bg-neutral-800 border-neutral-700">
                <td colSpan={4} className="px-2 py-1">
                  You do not have any cars in this location.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border border-neutral-700 bg-neutral-950 text-stone-200">
              <td className="px-2 py-1"></td>
              <td className="px-2 py-1">Total</td>
              <td className="px-2 py-1">${totalValue.toLocaleString()}</td>
              <td className="px-2 py-1">
                <button
                  onClick={sellAllCars}
                  className="font-medium hover:text-neutral-200"
                >
                  Sell All
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
        <p>
          <strong className="text-white">
            {character.cars?.[character.location]?.length || 0}
          </strong>{" "}
          of{" "}
          <strong className="text-white">
            {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
          </strong>{" "}
          parking slots used
        </p>
      </div>
    </Main>
  );
};

export default Parking;
