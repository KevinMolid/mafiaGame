import H2 from "./Typography/H2";
import { useState } from "react";
import Button from "./Button";
import { Link } from "react-router-dom";

import Airplanes from "../Data/Airplanes";

const Airplanedealer = () => {
  const [selectedPlane, setSelectedPlane] = useState<string | null>(null);

  return (
    <>
      <H2>
        <i className="fa-solid fa-plane-up"></i> Kjøp privatfly
      </H2>

      <p className="mb-4">
        Privatfly kan brukes fra{" "}
        <strong>
          <Link to="/flyplass">
            <i className={`fa-solid fa-plane`}></i> Flyplass
          </Link>{" "}
        </strong>
        for å reise eller transportere narkotika mellom byer.
      </p>

      {/* Same list/card layout style as Cardealer */}
      <ul className="flex flex-wrap gap-2 mb-4">
        {Airplanes.map((plane) => (
          <li
            key={plane.name}
            className={`flex border justify-between relative ${
              selectedPlane === plane.name
                ? "bg-neutral-900 border-neutral-600 cursor-pointer"
                : "bg-neutral-800 border-neutral-800 cursor-pointer"
            }`}
            onClick={() => setSelectedPlane(plane.name)}
          >
            <div className="flex flex-col gap-4 w-52">
              {plane.img && (
                <img
                  src={plane.img}
                  className={
                    "h-fit w-52 border-2 " +
                    (plane.tier === 1
                      ? "border-neutral-400"
                      : plane.tier === 2
                      ? "border-green-400"
                      : plane.tier === 3
                      ? "border-blue-400"
                      : plane.tier === 4
                      ? "border-purple-400"
                      : plane.tier === 5
                      ? "border-yellow-400"
                      : "")
                  }
                />
              )}

              <div className="flex flex-col justify-center w-full px-4 gap-2 pb-2">
                <div>
                  <p>
                    <strong
                      className={
                        plane.tier === 1
                          ? "text-neutral-400"
                          : plane.tier === 2
                          ? "text-green-400"
                          : plane.tier === 3
                          ? "text-blue-400"
                          : plane.tier === 4
                          ? "text-purple-400"
                          : plane.tier === 5
                          ? "text-yellow-400"
                          : ""
                      }
                    >
                      {plane.name}
                    </strong>
                  </p>

                  {/* Swap 'hp' for plane stats to mirror the info row in Cardealer */}
                  <div className="text-neutral-200 text-sm space-y-0.5">
                    <p>
                      Passasjerer:{" "}
                      <span className="text-white">{plane.passengerSlots}</span>
                    </p>
                    <p>
                      Max lastevekt:{" "}
                      <span className="text-white">
                        {plane.maxCargoLoad.toLocaleString()} kg
                      </span>
                    </p>
                    <p>
                      Brukskostnad:{" "}
                      <span className="text-white">
                        ${plane.flightCost.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Button area identical placement/behavior to Cardealer */}
                <Button
                  disabled={!selectedPlane || selectedPlane !== plane.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Hook up your buy logic here later (similar to Cardealer.handleBuy)
                    // For now this keeps the layout identical without extra logic:
                    // console.log("Buy plane:", plane);
                  }}
                >
                  Kjøp{" "}
                  <strong className="text-yellow-400">
                    ${plane.value.toLocaleString()}
                  </strong>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default Airplanedealer;
