import H2 from "./Typography/H2";
import Item from "./Typography/Item";
import { useMemo, useState, useEffect } from "react";
import Button from "./Button";
import InfoBox from "./InfoBox";

import Cars from "../Data/Cars";
import ParkingTypes from "../Data/ParkingTypes";

import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

import {
  getFirestore,
  doc,
  runTransaction,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
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

  const currentCity =
    (userCharacter as any)?.location ?? (userCharacter as any)?.city ?? "Tokyo";

  // LIVE: cars in current city (for capacity check)
  const [carsInCity, setCarsInCity] = useState<
    {
      id: string;
      name: string;
      value: number;
      hp: number;
      tier: number;
      isElectric?: boolean;
      city: string;
      acquiredAt?: any;
    }[]
  >([]);

  useEffect(() => {
    if (!userCharacter?.id || !currentCity) return;
    const carsCol = collection(db, "Characters", userCharacter.id, "cars");
    const qCity = query(carsCol, where("city", "==", currentCity));
    const unsub = onSnapshot(qCity, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setCarsInCity(arr);
    });
    return () => unsub();
  }, [userCharacter?.id, currentCity]);

  // LIVE: subscribe to the character doc to read dealership flags
  const [ownedEver, setOwnedEver] = useState<Set<string>>(new Set());
  const [boughtToday, setBoughtToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userCharacter?.id) return;
    const ref = doc(db, "Characters", userCharacter.id);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};
      const owned = (data?.dealership?.ownedModels ?? []) as string[];
      const daily = (data?.dealership?.dailyBought?.[dayKey] ?? []) as string[];
      setOwnedEver(new Set(owned));
      setBoughtToday(new Set(daily));
    });
    return () => unsub();
  }, [userCharacter?.id, dayKey]);

  const isBlocked = (name: string) =>
    ownedEver.has(name) || boughtToday.has(name);

  async function handleBuy(car: (typeof Cars)[number]) {
    if (!userCharacter || !userCharacter.id || !userData) {
      setMessageType("warning");
      setMessage("Du må være logget inn for å kjøpe bil.");
      return;
    }

    // quick client-side gate
    if (isBlocked(car.name)) return;

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
    const currentCount = carsInCity.length;
    if (currentCount >= slots) {
      setMessageType("warning");
      setMessage(
        `Du har ingen ledige parkeringsplasser i ${currentCity}. (${currentCount}/${slots})`
      );
      return;
    }

    if (money < car.value) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å kjøpe denne bilen.");
      return;
    }

    setIsBuying(true);
    try {
      // Create garage doc first (we'll keep its id if the transaction succeeds)
      // (You can also create it inside the transaction; here we create after TX to keep serverTimestamp.)
      // We'll do transaction first, THEN add the car doc to avoid creating a car if TX fails.
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(characterRef);
        if (!snap.exists()) {
          throw new Error("Character not found.");
        }
        const data = snap.data() || {};

        // Re-check inside TX: block if already owned (FOREVER) or bought today
        const owned = new Set<string>(
          (data?.dealership?.ownedModels ?? []) as string[]
        );
        const daily = new Set<string>(
          ((data?.dealership?.dailyBought ?? {})[dayKey] ?? []) as string[]
        );
        if (owned.has(car.name) || daily.has(car.name)) {
          throw new Error("Denne bilen er allerede kjøpt.");
        }

        const currentMoney = Number(data?.stats?.money ?? 0);
        if (currentMoney < car.value) {
          throw new Error("Ikke nok penger.");
        }

        // Atomic updates: decrease money + mark logs
        tx.update(characterRef, {
          "stats.money": currentMoney - car.value,
          // Mark bought today
          [`dealership.dailyBought.${dayKey}`]: Array.from(
            new Set([...(daily as any), car.name])
          ),
          // Mark owned ever
          "dealership.ownedModels": Array.from(
            new Set([...(owned as any), car.name])
          ),
        });
      });

      // Only after TX succeeds, add the car to the garage subcollection
      await addDoc(collection(db, "Characters", userCharacter.id, "cars"), {
        name: car.name,
        value: car.value,
        hp: car.hp,
        tier: car.tier,
        isElectric: !!car.isElectric,
        img: car.img ?? null,
        city: currentCity,
        acquiredAt: serverTimestamp(),
        source: "dealer",
      });

      setMessageType("success");
      setMessage(
        <p>
          Du kjøpte en <Item name={car.name} tier={car.tier} /> i {currentCity}{" "}
          for{" "}
          <strong>
            <i className="fa-solid fa-dollar-sign"></i>{" "}
            {car.value.toLocaleString("nb-NO")}
          </strong>
          !
        </p>
      );
      setSelectedCar(null);
    } catch (err: any) {
      console.error(err);
      setMessageType("failure");
      setMessage(err?.message || "Noe gikk galt under kjøpet. Prøv igjen.");
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
          const blocked = isBlocked(car.name);
          const selected = selectedCar === car.name;

          return (
            <li
              key={car.name}
              className={`flex border justify-between relative ${
                blocked
                  ? "opacity-60 bg-neutral-800 border-neutral-800"
                  : selected
                  ? "bg-neutral-900 border-neutral-600 cursor-pointer"
                  : "bg-neutral-800 border-neutral-800 cursor-pointer"
              }`}
              onClick={() => {
                if (blocked) return;
                setSelectedCar(car.name);
              }}
            >
              {blocked && (
                <span className="absolute top-1 right-1 font-semibold uppercase px-2 py-0.5 rounded border-2 border-neutral-400 text-neutral-200 bg-neutral-800">
                  Kjøpt
                </span>
              )}

              <div className="flex flex-col gap-4 w-52">
                {car.img && (
                  <img
                    src={car.img}
                    alt={car.name}
                    className={
                      "h-fit w-52 border-2 " +
                      (car.tier === 1
                        ? "border-neutral-400"
                        : car.tier === 2
                        ? "border-emerald-400"
                        : car.tier === 3
                        ? "border-sky-400"
                        : car.tier === 4
                        ? "border-violet-400"
                        : car.tier === 5
                        ? "border-amber-300"
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
                            ? "text-emerald-400"
                            : car.tier === 3
                            ? "text-sky-400"
                            : car.tier === 4
                            ? "text-violet-400"
                            : car.tier === 5
                            ? "text-amber-300"
                            : ""
                        }
                      >
                        {car.name}
                      </strong>
                    </p>
                    <p className="text-neutral-200">{car.hp} hk</p>
                  </div>

                  <Button
                    disabled={isBuying || blocked || !selected}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!blocked) handleBuy(car);
                    }}
                  >
                    {blocked ? (
                      "Kjøpt"
                    ) : (
                      <>
                        Kjøp{" "}
                        <strong className="text-yellow-400">
                          <i className="fa-solid fa-dollar-sign"></i>{" "}
                          {car.value.toLocaleString("nb-NO")}
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
