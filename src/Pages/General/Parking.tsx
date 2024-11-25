import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import Box from "../../components/Box";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";

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
  const { userCharacter } = useCharacter();
  const [parking, setParking] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [upgrading, setUpgrading] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");

  if (!userCharacter) {
    return null;
  }

  useEffect(() => {
    if (userCharacter?.parkingFacilities?.[userCharacter.location]) {
      const parkingSlots =
        userCharacter.parkingFacilities[userCharacter.location];
      setParking(parkingSlots);
    } else {
      setParking(0);
    }
  }, [userCharacter]);

  const updateParking = async (
    characterId: string,
    city: string,
    newParkingIndex: number
  ) => {
    const characterRef = doc(db, "Characters", characterId);
    const upgradeName = ParkingTypes[newParkingIndex].name;
    const upgradePrice = ParkingTypes[newParkingIndex].price;

    // Check if the character has enough money
    if (userCharacter.stats.money < upgradePrice) {
      setMessageType("warning");
      setMessage(`Du har ikke nok penger til å oppgradere parkering.`);
      return;
    }

    // Subtract the upgrade cost from the user's money
    const newMoney = userCharacter.stats.money - upgradePrice;

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
      userCharacter.cars?.[userCharacter.location]?.reduce(
        (acc: number, car: any) => acc + car.value,
        0
      ) || 0
    );
  }, [userCharacter]);

  // Function to sell a car
  const sellCar = async (carIndex: number) => {
    const carToSell = userCharacter.cars[userCharacter.location][carIndex];
    const updatedCars: Car[] = userCharacter.cars[
      userCharacter.location
    ].filter((_: any, index: number) => index !== carIndex);
    const newMoney = userCharacter.stats.money + carToSell.value;

    const characterRef = doc(db, "Characters", userCharacter.id);

    try {
      await updateDoc(characterRef, {
        [`cars.${userCharacter.location}`]: updatedCars,
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
    const carsToSell = userCharacter.cars[userCharacter.location] || [];
    const numberOfCars = carsToSell.length;

    if (numberOfCars === 0) {
      setMessageType("info");
      setMessage("Du har ingen biler å selge.");
      return;
    }

    const characterRef = doc(db, "Characters", userCharacter.id);
    const updatedCars: Car[] = [];
    let totalSoldValue = 0;

    for (const car of carsToSell) {
      totalSoldValue += car.value;
    }

    try {
      await updateDoc(characterRef, {
        [`cars.${userCharacter.location}`]: updatedCars,
        [`stats.money`]: userCharacter.stats.money + totalSoldValue,
      });

      setMessageType("success");
      setMessage(
        `Du solgte ${numberOfCars} ${
          numberOfCars === 1 ? "bil" : "biler"
        } for $${totalSoldValue.toLocaleString()}.`
      );
    } catch (error) {
      console.error("Feil ved salg av biler: ", error);
      setMessageType("failure");
      setMessage(`En ukjent feil dukket opp ved salg av biler.`);
    }
  };

  const toggleUpgrading = () => {
    setUpgrading(!upgrading);
  };

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <div className="flex flex-col gap-4">
        <div>
          <H1>Parkering</H1>
          <p>
            Dette er en oversikt over parkering og biler du har i{" "}
            <strong className="text-neutral-200">
              {userCharacter?.location}
            </strong>
            .
          </p>
        </div>

        {/* Infobox */}
        {message && <InfoBox type={messageType}>{message}</InfoBox>}

        {/* Parking facility */}
        {!upgrading && (
          <Box>
            <div className="flex justify-between flex-wrap-reverse items-baseline gap-x-4">
              <H2>
                {parking !== null ? ParkingTypes[parking].name : "Loading..."}
              </H2>

              <div className="flex justify-end flex-grow">
                <Button style="black" size="small" onClick={toggleUpgrading}>
                  <p>
                    Oppgrader <i className="fa-solid fa-circle-up"></i>
                  </p>
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Show loading if parking is still null */}
              <p>
                Plasser:{" "}
                <strong className="text-neutral-200">
                  {parking !== null
                    ? ParkingTypes[parking].slots
                    : "Loading..."}
                </strong>
              </p>
              <p>
                Sikkerhet:{" "}
                <strong className="text-neutral-200">
                  {parking !== null
                    ? ParkingTypes[parking].security
                    : "Loading..."}
                  %
                </strong>
              </p>
            </div>
          </Box>
        )}

        {canUpgrade && upgrading && (
          <Box>
            <div className="flex justify-between items-baseline gap-4">
              <H2>Oppgrader?</H2>
              <Button style="black" size="small" onClick={toggleUpgrading}>
                <p>
                  <i className="fa-solid fa-x"></i>
                </p>
              </Button>
            </div>

            <p className="mb-2">
              <strong className="text-neutral-200">
                {ParkingTypes[parking].name}{" "}
              </strong>
              <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
              <strong className="text-neutral-200">
                {" "}
                {ParkingTypes[parking + 1].name}
              </strong>
            </p>

            <div className="flex gap-x-8 gap-y-2 flex-wrap">
              <div>
                <H3>Plasser</H3>
                <p>
                  <strong className="text-neutral-200">
                    {ParkingTypes[parking].slots}{" "}
                  </strong>
                  <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
                  <strong className="text-neutral-200">
                    {" "}
                    {ParkingTypes[parking + 1].slots}
                  </strong>
                </p>
              </div>

              <div>
                <H3>Sikkerhet</H3>
                <p>
                  <strong className="text-neutral-200">
                    {ParkingTypes[parking].security}%{" "}
                  </strong>
                  <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
                  <strong className="text-neutral-200">
                    {" "}
                    {ParkingTypes[parking + 1].security}%
                  </strong>
                </p>
              </div>

              <div className="flex flex-grow justify-end items-end">
                <Button
                  onClick={() =>
                    parking !== null &&
                    updateParking(
                      userCharacter.id,
                      userCharacter.location,
                      parking + 1
                    )
                  }
                >
                  Oppgrader <i className="fa-solid fa-circle-up"></i>{" "}
                  <strong className="text-yellow-400">
                    ${ParkingTypes[parking + 1].price.toLocaleString()}
                  </strong>
                </Button>
              </div>
            </div>
          </Box>
        )}

        {/* Parking table */}
        {!upgrading && (
          <div>
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
                {userCharacter.cars?.[userCharacter.location]?.length ? (
                  userCharacter.cars[userCharacter.location].map(
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
                              className="font-medium text-neutral-200 hover:text-white"
                            >
                              Selg
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
                      className="font-medium text-neutral-200 hover:text-white"
                    >
                      Selg alle
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
            <p>
              <strong className="text-neutral-200">
                {userCharacter.cars?.[userCharacter.location]?.length || 0}
              </strong>{" "}
              av{" "}
              <strong className="text-neutral-200">
                {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
              </strong>{" "}
              plasser brukt.
            </p>
          </div>
        )}
      </div>
    </Main>
  );
};

export default Parking;
