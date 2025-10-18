// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H4 from "../../components/Typography/H4";
import Box from "../../components/Box";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Item from "../../components/Typography/Item";

// Functions
import {
  rewardXp,
  increaseHeat,
  arrest,
} from "../../Functions/RewardFunctions";
import { getCarByName, getCarByKey } from "../../Data/Cars";

// Data
import ParkingTypes from "../../Data/ParkingTypes";
import Cars from "../../Data/Cars";

// React
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

// Context
import { useAuth } from "../../AuthContext";
import { useCharacter } from "../../CharacterContext";
import { useCooldown } from "../../CooldownContext";

// Firebase
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getCountFromServer,
  getDocs,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import type { Car } from "../../Interfaces/Types";

// Cars by tier
const tiers: { [key: number]: Car[] } = {
  1: Cars.filter((car) => car.tier === 1),
  2: Cars.filter((car) => car.tier === 2),
  3: Cars.filter((car) => car.tier === 3),
  4: Cars.filter((car) => car.tier === 4),
  5: Cars.filter((car) => car.tier === 5),
};

// Weights for each tier (within success)
const tierWeights = [0.7, 0.22, 0.065, 0.013, 0.002];

type MsgType = "success" | "failure" | "info" | "warning";

const GTA = () => {
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<MsgType>("info");

  const { userCharacter } = useCharacter();
  const { userData } = useAuth();
  const { jailRemainingSeconds } = useCooldown();
  const { cooldowns, startCooldown } = useCooldown();
  const [helpActive, setHelpActive] = useState<boolean>(false);

  // --- Single form state ---
  const [source, setSource] = useState<"street" | "player">("street");
  const [targetName, setTargetName] = useState<string>("");
  const targetInputRef = useRef<HTMLInputElement | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const SUCCESS_CHANCE_STREET = 0.75; // 75%

  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, [userData, navigate, cooldowns]);

  const getRandom = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const getRandomTier = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < tierWeights.length; i++) {
      cumulative += tierWeights[i];
      if (rand < cumulative) return i + 1;
    }
    return 1;
  };

  // ---- FRA GATA (unchanged core) ----
  const stealCarFromStreet = async () => {
    if (!userCharacter || !userCharacter.id) {
      setMessageType("failure");
      setMessage("Brukeren er ikke lastet opp.");
      return;
    }

    if (cooldowns["gta"] > 0) {
      setMessageType("warning");
      setMessage("Du må vente før du kan stjele en bil.");
      return;
    }

    const tier = getRandomTier();
    const selectedTierCars = tiers[tier];
    const randomCar =
      selectedTierCars[getRandom(0, selectedTierCars.length - 1)];

    try {
      // 1) Capacity in current city
      const facilityType =
        userCharacter.parkingFacilities?.[userCharacter.location];
      if (facilityType === undefined || facilityType === 0) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen parkeringsplass i denne byen. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className="fa-solid fa-square-parking"></i> Parkering
              </Link>
            </strong>{" "}
            for å kjøpe parkering.
          </span>
        );
        return;
      }
      const availableSlots = (ParkingTypes[facilityType]?.slots ?? 0) as number;

      const carsCol = collection(db, "Characters", userCharacter.id, "cars");
      const qCity = query(carsCol, where("city", "==", userCharacter.location));
      const countSnap = await getCountFromServer(qCity);
      const currentCount = countSnap.data().count || 0;

      if (currentCount >= availableSlots) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen ledige parkeringsplasser. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className="fa-solid fa-square-parking"></i> Parkering
              </Link>
            </strong>{" "}
            for å oppgradere eller frigjøre plass.
          </span>
        );
        return;
      }

      // 2) Attempt theft (75% success)
      const success = Math.random() <= SUCCESS_CHANCE_STREET;

      if (success) {
        await addDoc(carsCol, {
          modelKey: randomCar.key,
          name: randomCar.name,
          value: randomCar.value,
          hp: randomCar.hp,
          tier: randomCar.tier,
          isElectric: !!randomCar.isElectric,
          city: userCharacter.location,
          acquiredAt: serverTimestamp(),
        });

        rewardXp(userCharacter, 10);
        increaseHeat(userCharacter, userCharacter.id, 1);

        const catalog = randomCar.key
          ? getCarByKey(randomCar.key)
          : getCarByName(randomCar.name);

        setMessageType("success");
        setMessage(
          <div>
            Du stjal en{" "}
            <Item
              name={randomCar.name}
              tier={randomCar.tier}
              tooltipImg={catalog?.img && catalog.img}
              tooltipContent={
                <div>
                  <p>
                    Effekt:{" "}
                    <strong className="text-neutral-200">
                      {randomCar.hp} hk
                    </strong>
                  </p>
                  <p>
                    Verdi:{" "}
                    <strong className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {randomCar.value.toLocaleString("nb-NO")}
                    </strong>
                  </p>
                </div>
              }
            />
            !
          </div>
        );

        startCooldown("gta");
        return;
      }

      // Failure (street)
      const tentativeHeat = Math.min(50, (userCharacter.stats.heat || 0) + 1);
      const jailChance = tentativeHeat; // 0–50%
      const shouldJail =
        tentativeHeat >= 50 || Math.random() * 100 < jailChance;

      if (shouldJail) {
        await arrest(userCharacter);
        setMessage("Du prøvde å stjele en bil, men ble arrestert!");
        setMessageType("failure");
        startCooldown("gta");
        return;
      }

      increaseHeat(userCharacter, userCharacter.id, 1);
      setMessage(
        "Du prøvde å stjele en bil, men feilet. Bedre lykke neste gang!"
      );
      setMessageType("failure");
      startCooldown("gta");
    } catch (error) {
      setMessageType("failure");
      setMessage("Du fikk ikke til å stjele en bil. Prøv igjen senere.");
      console.error("Feil ved oppdatering av bil:", error);
    }
  };

  // ---- FRA SPILLER ----
  const calcPlayerTheftSuccess = (securityPct: number | undefined) => {
    const security = Math.max(0, Math.min(100, securityPct ?? 0));
    return 0.5 * (1 - security / 100); // 50% × (100% − sikkerhet%)
  };

  const findCharacterByUsername = async (username: string) => {
    const uname = username.trim().toLowerCase();
    const charsRef = collection(db, "Characters");
    const q = query(charsRef, where("username_lowercase", "==", uname));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    return { id: docSnap.id, data: docSnap.data() as any };
  };

  const stealCarFromPlayer = async (username: string) => {
    if (!userCharacter || !userCharacter.id) {
      setMessageType("failure");
      setMessage("Brukeren er ikke lastet opp.");
      return;
    }
    if (cooldowns["gta"] > 0) {
      setMessageType("warning");
      setMessage("Du må vente før du kan stjele en bil.");
      return;
    }
    const attackerCity = userCharacter.location;
    setIsBusy(true);

    try {
      // Must have parking space to receive car
      const myFacilityType =
        userCharacter.parkingFacilities?.[attackerCity] ?? 0;
      if (!myFacilityType) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen parkeringsplass i denne byen. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className="fa-solid fa-square-parking"></i> Parkering
              </Link>
            </strong>{" "}
            for å kjøpe parkering.
          </span>
        );
        setIsBusy(false);
        return;
      }
      const mySlots = (ParkingTypes[myFacilityType]?.slots ?? 0) as number;

      const myCarsCol = collection(db, "Characters", userCharacter.id, "cars");
      const myCityCountSnap = await getCountFromServer(
        query(myCarsCol, where("city", "==", attackerCity))
      );
      const myCount = myCityCountSnap.data().count || 0;
      if (myCount >= mySlots) {
        setMessageType("warning");
        setMessage(
          <span>
            Du har ingen ledige parkeringsplasser. Gå til{" "}
            <strong>
              <Link to="/parkering">
                <i className="fa-solid fa-square-parking"></i> Parkering
              </Link>
            </strong>{" "}
            for å oppgradere eller frigjøre plass.
          </span>
        );
        setIsBusy(false);
        return;
      }

      // Resolve target
      const target = await findCharacterByUsername(username.trim());
      if (!target) {
        setMessageType("warning");
        setMessage("Fant ingen spiller med dette brukernavnet.");
        setIsBusy(false);
        return;
      }
      if (target.id === userCharacter.id) {
        setMessageType("warning");
        setMessage("Du kan ikke stjele fra deg selv.");
        setIsBusy(false);
        return;
      }
      if ((target.data?.role as string) === "admin") {
        setMessageType("warning");
        setMessage("Du kan ikke stjele fra en administrator.");
        setIsBusy(false);
        return;
      }

      // Target must have parking + cars in same city
      const tFacilityType = target.data?.parkingFacilities?.[attackerCity] ?? 0;
      if (!tFacilityType) {
        setMessageType("warning");
        setMessage("Denne spilleren har ikke parkering i denne byen.");
        setIsBusy(false);
        return;
      }

      const targetCarsCol = collection(db, "Characters", target.id, "cars");
      const tCityCarsSnap = await getDocs(
        query(targetCarsCol, where("city", "==", attackerCity))
      );
      if (tCityCarsSnap.empty) {
        setMessageType("warning");
        setMessage("Denne spilleren har ingen biler parkert i denne byen.");
        setIsBusy(false);
        return;
      }

      // Success chance
      const securityPct = (ParkingTypes[tFacilityType]?.security ??
        0) as number;
      const successChance = calcPlayerTheftSuccess(securityPct);
      const success = Math.random() <= successChance;

      if (success) {
        // Pick a random car from target in this city
        const carsDocs = tCityCarsSnap.docs;
        const chosen = carsDocs[getRandom(0, carsDocs.length - 1)];
        const carData = chosen.data();

        // Transfer: add to attacker
        await addDoc(myCarsCol, {
          modelKey: carData.modelKey ?? null,
          name: carData.name,
          value: carData.value,
          hp: carData.hp,
          tier: carData.tier,
          isElectric: !!carData.isElectric,
          city: attackerCity,
          acquiredAt: serverTimestamp(),
          stolenFrom: target.id,
        });

        // Remove from target
        await deleteDoc(doc(db, "Characters", target.id, "cars", chosen.id));

        // --- NEW: build car snapshot for alert and write alert ---
        const catalog = carData.modelKey
          ? getCarByKey(carData.modelKey)
          : getCarByName(carData.name);

        const carSnapshot = {
          modelKey: carData.modelKey ?? null,
          name: carData.name,
          tier: carData.tier,
          hp: carData.hp,
          value: carData.value,
          isElectric: !!carData.isElectric,
          img: catalog?.img ?? null, // lets Item render a tooltip image
          city: attackerCity, // optional
        };

        await addDoc(collection(db, "Characters", target.id, "alerts"), {
          type: "gta",
          carLost: true,
          car: carSnapshot,
          read: false,
          robberId: userCharacter.id,
          robberName: userCharacter.username,
          timestamp: serverTimestamp(),
        });
        // --- END NEW ---

        rewardXp(userCharacter, 15);
        increaseHeat(userCharacter, userCharacter.id, 2);

        const catalogForMsg = carData.modelKey
          ? getCarByKey(carData.modelKey)
          : getCarByName(carData.name);

        setMessageType("success");
        setMessage(
          <div>
            Du stjal en{" "}
            <Item
              name={carData.name}
              tier={carData.tier}
              tooltipImg={catalogForMsg?.img && catalogForMsg.img}
              tooltipContent={
                <div>
                  <p>
                    Effekt:{" "}
                    <strong className="text-neutral-200">
                      {carData.hp} hk
                    </strong>
                  </p>
                  <p>
                    Verdi:{" "}
                    <strong className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {Number(carData.value).toLocaleString("nb-NO")}
                    </strong>
                  </p>
                </div>
              }
            />{" "}
            fra{" "}
            <strong className="text-neutral-200">
              {target.data?.username ?? "spilleren"}
            </strong>
            !
          </div>
        );

        startCooldown("gta");
        setIsBusy(false);
        return;
      }

      // Failure (player)
      const tentativeHeat = Math.min(50, (userCharacter.stats.heat || 0) + 2);
      const jailChance = tentativeHeat;
      const shouldJail =
        tentativeHeat >= 50 || Math.random() * 100 < jailChance;

      if (shouldJail) {
        await arrest(userCharacter);
        setMessage(
          "Du mislyktes i å stjele bil fra en spiller og ble arrestert!"
        );
        setMessageType("failure");
        startCooldown("gta");
        setIsBusy(false);
        return;
      }

      increaseHeat(userCharacter, userCharacter.id, 2);
      setMessage(
        "Du mislyktes i å stjele bil fra spilleren. Bedre lykke neste gang!"
      );
      setMessageType("failure");
      startCooldown("gta");
      setIsBusy(false);
    } catch (err) {
      console.error(err);
      setMessageType("failure");
      setMessage("Noe gikk galt under ranet. Prøv igjen senere.");
      setIsBusy(false);
    }
  };

  // --- Single form submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    if (source === "street") {
      await stealCarFromStreet();
    } else {
      if (!targetName.trim()) {
        setMessageType("warning");
        setMessage("Skriv inn brukernavn for spilleren du vil rane.");
        return;
      }
      await stealCarFromPlayer(targetName);
    }
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <div className="flex items-baseline justify-between gap-4">
        <H1>Biltyveri</H1>
        {helpActive ? (
          <Button
            size="small-square"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small-square"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>

      <p className="pb-2">
        Her kan du stjele en bil fra gata eller fra en annen spiller.
      </p>

      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm flex gap-x-8 flex-wrap">
            <article>
              <H4>Stjele en bil fra gata</H4>
              <p className="mb-2">
                Det er {SUCCESS_CHANCE_STREET * 100}% sjanse for å stjele en
                bil.
              </p>
              <section className="mb-4">
                <p>Fordelingen av biler dersom biltyveriet er vellykket:</p>
                {tierWeights.map((w, index) => (
                  <p key={index}>
                    {index === 0
                      ? "Vanlig"
                      : index === 1
                      ? "Uvanlig"
                      : index === 2
                      ? "Sjelden"
                      : index === 3
                      ? "Episk"
                      : "Legendarisk"}
                    :{" "}
                    <strong className="text-neutral-200">
                      {(w * 100).toFixed(1)}%
                    </strong>
                  </p>
                ))}
              </section>
            </article>
            <article>
              <H4>Stjele en bil fra spiller</H4>
              <p className="mb-2">
                Grunnsjansen er 50%. Målet må ha parkering med biler i samme by.
                Har målet parkering med sikkerhet, reduseres sjansen:{" "}
                <code>50% × (100% − sikkerhet%)</code>.
              </p>
              <p>
                Eksempel: 15% sikkerhet →{" "}
                <strong className="text-neutral-200">42,5%</strong>.
              </p>
            </article>
          </Box>
        </div>
      )}

      {cooldowns["gta"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">{cooldowns["gta"]}</span>{" "}
          sekunder før du kan stjele en bil.
        </p>
      )}

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {/* --- Single form --- */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <H2>Hvor vil du stjele fra?</H2>

        <ul className="flex gap-2 flex-wrap mb-4">
          <li
            className={"flex flex-grow text-center cursor-pointer max-w-64 "}
            onClick={() => setSource("street")}
          >
            <button
              type="button"
              className={
                "border px-4 py-2 flex-grow text-center cursor-pointer " +
                (source === "street"
                  ? "bg-neutral-900 border-neutral-600 text-white "
                  : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
              }
            >
              Fra gata
            </button>
          </li>
          <li
            className={"flex flex-grow text-center cursor-pointer max-w-64 "}
            onClick={() => {
              setSource("player");
              setTimeout(() => targetInputRef.current?.focus(), 0);
            }}
          >
            <button
              type="button"
              className={
                "border px-4 py-2 flex-grow text-center cursor-pointer " +
                (source === "player"
                  ? "bg-neutral-900 border-neutral-600 text-white "
                  : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
              }
            >
              Fra spiller
            </button>
          </li>
        </ul>

        {source === "player" && (
          <input
            ref={targetInputRef}
            className="bg-transparent border-b border-neutral-600 py-1 mb-4 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Brukernavn"
            value={targetName}
            spellCheck={false}
            onChange={(e) => setTargetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(e);
            }}
          />
        )}

        <div>
          <Button type="submit" disabled={isBusy}>
            {isBusy
              ? source === "street"
                ? "Utfører tyveri..."
                : "Utfører tyveri fra spiller..."
              : source === "street"
              ? "Utfør tyveri fra gata"
              : "Utfør tyveri fra spiller"}
          </Button>
        </div>
      </form>
    </Main>
  );
};

export default GTA;
