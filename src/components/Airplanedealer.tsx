import H2 from "./Typography/H2";
import { useState } from "react";
import Button from "./Button";

import { Link } from "react-router-dom";

import Airplanes from "../Data/Airplanes";

const Airplanedealer = () => {
  const [selectedCar, setSelectedCar] = useState<string | null>(null);

  return (
    <>
      <H2>
        <i className="fa-solid fa-plane-up"></i> Kjøp privatfly
      </H2>
      <p className="mb-4">
        Privatfly kan brukes fra{" "}
        <Link to="/flyplass" className="text-neutral-200 font-medium">
          Flyplass
        </Link>{" "}
        for å reise eller transportere narkotika mellom byer.
      </p>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-4">
        {Airplanes.map((airplane) => {
          return (
            <li
              key={airplane.name}
              className={`flex border pr-4 justify-between items-center text-sm hover:bg-neutral-900 cursor-pointer ${
                selectedCar === airplane.name
                  ? "bg-neutral-900 border-neutral-400"
                  : "bg-neutral-800 border-neutral-800"
              }`}
              onClick={() => setSelectedCar(airplane.name)}
            >
              <div className="flex gap-4 w-full">
                {airplane.img && (
                  <img
                    src={airplane.img}
                    className={
                      "w-32 object-cover border-2 " +
                      (airplane.tier === 1
                        ? "border-neutral-600"
                        : airplane.tier === 2
                        ? "border-green-400"
                        : airplane.tier === 3
                        ? "border-blue-400"
                        : airplane.tier === 4
                        ? "border-purple-400"
                        : airplane.tier === 5
                        ? "border-yellow-400"
                        : "")
                    }
                  />
                )}
                <div className="flex flex-col my-2 justify-center w-full">
                  <p>
                    <strong
                      className={
                        airplane.tier === 1
                          ? "text-neutral-400"
                          : airplane.tier === 2
                          ? "text-green-400"
                          : airplane.tier === 3
                          ? "text-blue-400"
                          : airplane.tier === 4
                          ? "text-purple-400"
                          : airplane.tier === 5
                          ? "text-yellow-400"
                          : ""
                      }
                    >
                      {airplane.name}
                    </strong>
                  </p>
                  <div className="flex justify-between flex-wrap gap-x-4">
                    <p>
                      Passasjerer:{" "}
                      <span className="text-white">
                        {airplane.passengerSlots}
                      </span>
                    </p>
                    <p>
                      Max lastevekt:{" "}
                      <span className="text-white">
                        {airplane.maxCargoLoad.toLocaleString()} kg
                      </span>
                    </p>
                    <p>
                      Brukskostnad:{" "}
                      <span className="text-white">
                        ${airplane.flightCost.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      {" "}
                      <strong className="text-yellow-400">
                        ${airplane.value.toLocaleString()}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <Button>Kjøp</Button>
    </>
  );
};

export default Airplanedealer;
