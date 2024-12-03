import H2 from "./Typography/H2";
import { useState } from "react";
import Button from "./Button";

import Cars from "../Data/Cars";

const Cardealer = () => {
  const [selectedCar, setSelectedCar] = useState<string | null>(null);

  return (
    <>
      <H2>
        <i className="fa-solid fa-car-side"></i> Biler
      </H2>
      <p className="mb-4">Biler kan brukes til Street Racing i Tokyo.</p>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-4">
        {Cars.map((car) => {
          return (
            <li
              key={car.name}
              className={`flex border pr-4 justify-between items-center cursor-pointer ${
                selectedCar === car.name
                  ? "bg-neutral-900 border-neutral-600"
                  : "bg-neutral-800 border-neutral-800"
              }`}
              onClick={() => setSelectedCar(car.name)}
            >
              <div className="flex gap-4 w-full">
                {car.img && (
                  <img
                    src={car.img}
                    className={
                      "h-20 border-2 " +
                      (car.tier === 1
                        ? "border-neutral-600"
                        : car.tier === 2
                        ? "border-green-400"
                        : car.tier === 3
                        ? "border-blue-400"
                        : car.tier === 4
                        ? "border-purple-400"
                        : car.tier === 5
                        ? "border-yellow-400"
                        : "")
                    }
                  />
                )}
                <div className="flex flex-col justify-center w-full">
                  <p>
                    <strong
                      className={
                        car.tier === 1
                          ? "text-neutral-400"
                          : car.tier === 2
                          ? "text-green-400"
                          : car.tier === 3
                          ? "text-blue-400"
                          : car.tier === 4
                          ? "text-purple-400"
                          : car.tier === 5
                          ? "text-yellow-400"
                          : ""
                      }
                    >
                      {car.name}
                    </strong>
                  </p>
                  <div className="flex justify-between">
                    <p className="text-neutral-200">{car.hp} hp</p>
                    <p>
                      {" "}
                      <strong className="text-yellow-400">
                        ${car.value.toLocaleString()}
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

export default Cardealer;
