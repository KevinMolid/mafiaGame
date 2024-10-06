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
            {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
          </p>
          <p>Security: 0</p>
        </div>
        {canUpgrade && (
          <div className="mt-2">
            <p>Next upgrade:</p>
            <div className="bg-slate-400 text-black p-2 rounded-lg">
              <p>
                <strong>{ParkingTypes[parking + 1].name}</strong>
              </p>
              <div className="grid grid-cols-2">
                <div>
                  <p>Slots: {ParkingTypes[parking + 1].slots}</p>
                  <p>Security: 0</p>
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
          <tr className="border bg-neutral-800 border-neutral-700">
            <td className="px-2 py-1">Toyota RAV4</td>
            <td className="px-2 py-1">203 hp</td>
            <td className="px-2 py-1">{"$" + (15000).toLocaleString()}</td>
            <td className="px-2 py-1">sell</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong className="text-white">1</strong> of{" "}
        <strong className="text-white">
          {parking !== null ? ParkingTypes[parking].slots : "Loading..."}
        </strong>{" "}
        parking slots used
      </p>
    </section>
  );
};

export default Parking;
