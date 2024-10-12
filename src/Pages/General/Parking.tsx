import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";

import { useState, useEffect } from "react";

import { useCharacter } from "../../CharacterContext";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../../firebaseConfig";

import ParkingTypes from "../../Data/ParkingTypes";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Parking = () => {
  const { character, setCharacter } = useCharacter();
  const [parking, setParking] = useState<number | null>(null);

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

    try {
      await updateDoc(characterRef, {
        [`parkingFacilities.${city}`]: newParkingIndex,
      });

      setCharacter((prevCharacter) =>
        prevCharacter
          ? {
              ...prevCharacter,
              parkingFacilities: {
                ...prevCharacter.parkingFacilities,
                [city]: newParkingIndex,
              },
            }
          : prevCharacter
      );

      setParking(newParkingIndex);
    } catch (error) {
      console.error("Error updating parking facility: ", error);
    }
  };

  const canUpgrade = parking !== null && parking < ParkingTypes.length - 1;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <H1>{character?.location} Parking</H1>
        <p>
          This is an overview of your parking lot and all the cars you own in{" "}
          {character?.location}
        </p>
      </div>
      <div>
        <H2>{parking !== null ? ParkingTypes[parking].name : "Loading..."}</H2>
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
              {parking !== null ? ParkingTypes[parking].security : "Loading..."}
              %
            </strong>
          </p>
        </div>
        {canUpgrade && (
          <div className="mt-2">
            <p>Next upgrade:</p>
            <div className="bg-sky-950 border border-sky-700 text-slate-400 px-4 py-2 rounded-lg mt-1">
              <H2>{ParkingTypes[parking + 1].name}</H2>
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
                    Security: <strong>{ParkingTypes[parking].security}%</strong>{" "}
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
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
          {character.cars?.[character.location]?.map(
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
                  <td className="px-2 py-1">sell</td>
                </tr>
              );
            }
          )}
        </tbody>
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
    </section>
  );
};

export default Parking;
