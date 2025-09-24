import H2 from "./Typography/H2";
import { useMemo, useState } from "react";
import Button from "./Button";

import Cars from "../Data/Cars";

/** Simple string -> uint32 hash */
function hash32(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0; // FNV-1a style
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) from a uint32 seed */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick N unique items using provided rng */
function pickN<T>(arr: T[], n: number, rng: () => number) {
  const copy = arr.slice();
  // Fisher–Yates with seeded RNG
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

const Cardealer = () => {
  const [selectedCar, setSelectedCar] = useState<string | null>(null);

  // const { userData } = useAuth(); // optional
  // Prefer a stable per-player key if you have it:
  // const playerKey = userData?.activeCharacter ?? userData?.uid ?? "global";
  const playerKey = "global"; // replace with your player key if available

  // New cars every calendar day (YYYY-MM-DD)
  const dayKey = new Date().toISOString().slice(0, 10);

  // Deterministic seed from (player + day)
  const rng = useMemo(
    () => mulberry32(hash32(`${playerKey}:${dayKey}`)),
    [playerKey, dayKey]
  );

  const todaysCars = useMemo(() => pickN(Cars, 3, rng), [rng]);

  return (
    <>
      <H2>
        <i className="fa-solid fa-car-side"></i> Bilforhandler
      </H2>
      <p className="mb-4">
        Her kan du kjøpe biler. Hver dag legges det ut tre tilfeldige biler for
        salg. Typen bil er forskjellig fra spiller til spiller.
      </p>
      <p className="mb-4">Biler kan brukes til StreetRacing i Tokyo</p>

      <ul className="flex flex-wrap gap-2 mb-4">
        {todaysCars.map((car) => (
          <li
            key={car.name}
            className={`flex border justify-between items-center cursor-pointer ${
              selectedCar === car.name
                ? "bg-neutral-900 border-neutral-600"
                : "bg-neutral-800 border-neutral-800"
            }`}
            onClick={() => setSelectedCar(car.name)}
          >
            <div className="flex flex-col gap-4 w-full">
              {car.img && (
                <img
                  src={car.img}
                  className={
                    "h-28 w-fit border-2 " +
                    (car.tier === 1
                      ? "border-neutral-400"
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
              <div className="flex flex-col justify-center w-full px-4 gap-2 pb-2">
                <div>
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
                  <p className="text-neutral-200">{car.hp} hk</p>
                </div>

                <Button disabled={!selectedCar || selectedCar != car.name}>
                  Kjøp{" "}
                  <strong className="text-yellow-400">
                    ${car.value.toLocaleString()}
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

export default Cardealer;
