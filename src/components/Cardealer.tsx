import H2 from "./Typography/H2";
import Item from "./Typography/Item";
import { useMemo, useState } from "react";
import Button from "./Button";
import InfoBox from "./InfoBox";

import Cars from "../Data/Cars";
import ParkingTypes from "../Data/ParkingTypes";

import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";

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
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

type MessageType = "success" | "failure" | "important" | "warning" | "info";

const db = getFirestore();

const Cardealer = () => {
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<MessageType>("info");

  // local optimistic set for instant UI; persisted state comes from Firestore below
  const [boughtSet, setBoughtSet] = useState<Set<string>>(new Set());

  const { userCharacter } = useCharacter();
  const { userData } = useAuth();

  // Stable per-player key (deterministic daily selection)
  const playerKey = userData?.activeCharacter ?? userData?.uid ?? "global";
  const dayKey = new Date().toISOString().slice(0, 10);
  const rng = useMemo(
    () => mulberry32(hash32(`${playerKey}:${dayKey}`)),
    [playerKey, dayKey]
  );

  const todaysCars = useMemo(() => pickN(Cars, 3, rng), [rng]);

  // helpers based on GTA conventions
  const currentCity =
    (userCharacter as any)?.location ?? (userCharacter as any)?.city ?? "Tokyo";

  // --- PERSISTED "bought today" from Firestore (hydration) ---
  const boughtFromServer = useMemo(() => {
    const list = ((userCharacter as any)?.dealership?.dailyBought?.[dayKey] ??
      []) as string[];
    return new Set<string>(list);
  }, [userCharacter, dayKey]);

  const boughtFromGarage = useMemo(() => {
    const carsObj = (userCharacter as any)?.cars ?? {};
    const names: string[] = [];
    const keyOf = (t: number) => new Date(t).toISOString().slice(0, 10); // UTC key, matches dayKey
    for (const city in carsObj) {
      const arr = carsObj[city] as any[];
      if (!Array.isArray(arr)) continue;
      for (const c of arr) {
        const t = c?.boughtAt;
        if (
          typeof t === "number" &&
          keyOf(t) === dayKey &&
          typeof c?.name === "string"
        ) {
          names.push(c.name);
        }
      }
    }
    return new Set<string>(names);
  }, [userCharacter, dayKey]);

  const isBought = (name: string) =>
    boughtFromServer.has(name) ||
    boughtFromGarage.has(name) ||
    boughtSet.has(name);

  async function handleBuy(car: (typeof Cars)[number]) {
    if (!userCharacter || !userCharacter.id || !userData) {
      setMessageType("warning");
      setMessage("Du må være logget inn for å kjøpe bil.");
      return;
    }

    // prevent double-buy clicks
    if (isBought(car.name)) return;

    const characterRef = doc(db, "Characters", userCharacter.id);

    const money = (userCharacter as any)?.stats?.money ?? 0;
    const facilityType = (userCharacter as any)?.parkingFacilities?.[
      currentCity
    ];
    const hasFacility = facilityType !== undefined && facilityType !== 0;

    if (!hasFacility) {
      setMessageType("warning");
      setMessage("Du har ingen parkeringsplass i denne byen.");
      return;
    }

    const slots = ParkingTypes[facilityType]?.slots ?? 0;
    const currentCars: any[] =
      (userCharacter as any)?.cars?.[currentCity] ?? [];

    // capacity check
    if (currentCars.length >= slots) {
      setMessageType("warning");
      setMessage(
        `Du har ingen ledige parkeringsplasser i ${currentCity}. (${currentCars.length}/${slots})`
      );
      return;
    }

    // money check
    if (money < car.value) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å kjøpe denne bilen.");
      return;
    }

    setIsBuying(true);
    try {
      const updatedCars = [
        ...currentCars,
        {
          name: car.name,
          value: car.value,
          hp: car.hp,
          tier: car.tier,
          img: car.img ?? null,
          city: currentCity,
          boughtAt: Date.now(),
        },
      ];

      // Single atomic doc update:
      // - add car to garage
      // - subtract money
      // - mark this car as bought today (persists across reloads)
      await updateDoc(characterRef, {
        [`cars.${currentCity}`]: updatedCars,
        "stats.money": increment(-car.value),
        [`dealership.dailyBought.${dayKey}`]: arrayUnion(car.name),
      });

      // optimistic UI so it's locked immediately
      setBoughtSet((prev) => {
        const next = new Set(prev);
        next.add(car.name);
        return next;
      });

      setMessageType("success");
      setMessage(
        <p>
          Du kjøpte en <Item {...car} /> i {currentCity} for{" "}
          <strong>${car.value.toLocaleString()}</strong>!
        </p>
      );
      setSelectedCar(null);
    } catch (err) {
      console.error(err);
      setMessageType("failure");
      setMessage("Noe gikk galt under kjøpet. Prøv igjen.");
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <>
      <H2>
        <i className="fa-solid fa-car-side"></i> Bilforhandler
      </H2>
      <p className="mb-2">
        Her kan du kjøpe biler. Hver dag legges det ut tre tilfeldige biler for
        salg. Typen bil er forskjellig fra spiller til spiller.
      </p>
      <p className="mb-4">Biler kan brukes til StreetRacing i Tokyo</p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <ul className="flex flex-wrap gap-2 mb-4">
        {todaysCars.map((car) => {
          const bought = isBought(car.name);
          return (
            <li
              key={car.name}
              className={`flex border justify-between relative ${
                bought
                  ? "opacity-60 bg-neutral-800 border-neutral-800"
                  : selectedCar === car.name
                  ? "bg-neutral-900 border-neutral-600 cursor-pointer"
                  : "bg-neutral-800 border-neutral-800 cursor-pointer"
              }`}
              onClick={() => {
                if (bought) return; // block selecting bought cars
                setSelectedCar(car.name);
              }}
            >
              {/* small badge when bought */}
              {bought && (
                <span className="absolute top-1 right-1 font-semibold uppercase px-2 py-0.5 rounded border-2 border-neutral-400 text-neutral-200 bg-neutral-800">
                  Kjøpt
                </span>
              )}

              <div className="flex flex-col gap-4 w-52">
                {car.img && (
                  <img
                    src={car.img}
                    className={
                      "h-fit w-52 border-2 " +
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

                  <Button
                    disabled={
                      isBuying ||
                      bought ||
                      !selectedCar ||
                      selectedCar !== car.name
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!bought) handleBuy(car);
                    }}
                  >
                    {bought ? (
                      "Kjøpt"
                    ) : (
                      <>
                        Kjøp{" "}
                        <strong className="text-yellow-400">
                          ${car.value.toLocaleString()}
                        </strong>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default Cardealer;
