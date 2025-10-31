// Components
import Main from "../components/Main";
import H3 from "../components/Typography/H3";
import Button from "../components/Button";

import Dialogue from "../components/Dialogue";

import Lisa from "/images/characters/Lisa.png";

// React
import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";

// Context
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

// Firebase
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cities = ["Mexico City", "New York", "Moskva", "Rio de Janeiro", "Tokyo"];

const CreateCharacter = () => {
  const { user, userData, setUserData } = useAuth();
  const { userCharacter, setUserCharacter } = useCharacter();
  const [location, setLocation] = useState<string>(() => {
    const i = Math.floor(Math.random() * cities.length);
    return cities[i];
  });
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isIntroActive, setIsIntroActive] = useState(true);

  type NameStatus = "idle" | "checking" | "available" | "taken" | "invalid";
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");
  const lastCheckedRef = useRef<string>("");

  const navigate = useNavigate();

  if (
    userData.type !== "admin" &&
    userCharacter &&
    userCharacter.status === "alive"
  ) {
    return <Navigate to="/" />;
  }

  /* Handle username input field */
  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const regex = /^[A-Za-zæÆøØåÅ0-9]*$/;

    if (!regex.test(value)) {
      setError("Brukernavnet kan bare inneholde tall og bokstaver.");
      setUsername(value);
      setNameStatus("invalid");
      return;
    }
    if (value.length > 11) {
      setError("Brukernavnet kan ikke være lengre enn 11 tegn.");
      setUsername(value);
      setNameStatus("invalid");
      return;
    }

    setUsername(value);
    setError(""); // clear format error; availability checked in effect
    setNameStatus(value.length >= 3 ? "checking" : "invalid");
  }

  // Check if the username already exists in the "Characters" collection
  async function isUsernameUnique(username: string) {
    const lowercaseUsername = username.toLowerCase();
    const q = query(
      collection(db, "Characters"),
      where("username_lowercase", "==", lowercaseUsername)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // true if no documents found
  }

  // NEW: Debounced live availability check
  useEffect(() => {
    // preconditions: format valid + >=3 chars
    const regex = /^[A-Za-zæÆøØåÅ0-9]*$/;
    if (!regex.test(username) || username.length < 3 || username.length > 11) {
      setNameStatus(username ? "invalid" : "idle");
      return;
    }

    setNameStatus("checking");
    const candidate = username;
    lastCheckedRef.current = candidate;

    const t = setTimeout(async () => {
      try {
        const unique = await isUsernameUnique(candidate);
        // Guard against out-of-order responses
        if (lastCheckedRef.current !== candidate) return;

        setNameStatus(unique ? "available" : "taken");
        if (!unique) setError("Brukernavnet finnes allerede.");
        else setError(""); // clear any previous error
      } catch {
        // Network or query error — treat as unknown/invalid UX-wise
        if (lastCheckedRef.current !== candidate) return;
        setNameStatus("invalid");
      }
    }, 400); // debounce

    return () => clearTimeout(t);
  }, [username]);

  async function handleClick() {
    // Final sync checks before write
    const regex = /^[A-Za-zæÆøØåÅ0-9]*$/;
    if (!regex.test(username) || username.length < 3 || username.length > 11) {
      setError(
        username.length < 3
          ? "Brukernavnet må inneholde minst 3 tegn."
          : "Ugyldig brukernavn."
      );
      return;
    }

    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      setError("Brukernavnet finnes allerede.");
      setNameStatus("taken");
      return;
    }

    try {
      // ... your existing addDoc + updates unchanged
      const newCharacterData = {
        uid: user.uid,
        username: username,
        username_lowercase: username.toLowerCase(),
        img: "",
        currentRank: 1,
        status: "alive",
        stats: { xp: 0, hp: 100, heat: 0, bank: 0, money: 1000, protection: 0 },
        reputation: { police: 0, politics: 0, gangs: 0, community: 0 },
        location: location,
        createdAt: serverTimestamp(),
        diedAt: null,
        lastCrimeTimestamp: null,
        profileText: "",
      };

      const docRef = await addDoc(
        collection(db, "Characters"),
        newCharacterData
      );

      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        characters: arrayUnion(docRef.id),
        activeCharacter: docRef.id,
      });

      setUserCharacter({
        id: docRef.id,
        ...newCharacterData,
        createdAt: new Date(),
      });

      setUserData({
        ...user,
        characters: [...(user.characters || []), docRef.id],
        activeCharacter: docRef.id,
      });

      navigate("/");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  function UsernameHint() {
    if (!username) return null;
    if (nameStatus === "checking")
      return <span className="text-stone-400">Sjekker tilgjengelighet…</span>;
    if (nameStatus === "available")
      return (
        <span className="text-emerald-500">
          Tilgjengelig <i className="fa-solid fa-check"></i>
        </span>
      );
    if (nameStatus === "taken")
      return <span className="text-red-500">Opptatt ✖</span>;
    if (nameStatus === "invalid")
      return (
        <span className="text-amber-500">
          Minst 3 tegn. Kun bokstaver og tall.
        </span>
      );
    return null;
  }

  const isSubmitDisabled =
    nameStatus !== "available" || !!error || username.length === 0;

  return (
    <Main img="MafiaBg">
      {isIntroActive ? (
        <div
          id="modal"
          className="w-full h-full flex justify-center left-0 top-0 z-50"
        >
          <Dialogue
            className="order-1 sm:order-2 mx-auto sm:mx-0"
            imageSrc={Lisa}
            imageAlt="Lisa"
            speaker="Lisa"
            lines={[
              "Hei! Jeg er Lisa...",
              "Om du skal ha en sjanse her, må du lære raskt!",
              "Jeg skal vise deg rundt, men først; hvem er du?",
            ]}
            onComplete={() => setIsIntroActive(false)}
          />
        </div>
      ) : (
        <div className="gap-8">
          <div className="order-2 sm:order-1">
            <form action="" className="flex flex-col mt-4 mb-4">
              <input
                className={
                  "bg-transparent border-b py-1 text-2xl font-medium text-white placeholder-neutral-500 focus:outline-none " +
                  (nameStatus === "taken"
                    ? "border-red-500 focus:border-red-500"
                    : nameStatus === "available"
                    ? "border-emerald-500 focus:border-emerald-500"
                    : "border-neutral-600 focus:border-white")
                }
                id="username"
                type="text"
                placeholder="Brukernavn"
                value={username}
                onChange={handleUsernameChange}
                maxLength={11}
                autoComplete="off"
                spellCheck={false}
              />
              <div className="min-h-[1.5rem] mb-2">
                {/* Live hint or error */}
                {error ? (
                  <span className="text-red-500">{error}</span>
                ) : (
                  <UsernameHint />
                )}
              </div>

              <H3>Startområde</H3>
              <ul className="flex gap-2 flex-wrap">
                {cities.map((city) => (
                  <li
                    key={city}
                    className={
                      "border px-4 py-2 flex-grow text-center cursor-pointer " +
                      (city === location
                        ? "bg-neutral-900 border-neutral-600"
                        : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
                    }
                    onClick={() => setLocation(city)}
                  >
                    <p className={city === location ? "text-white" : ""}>
                      {city}
                    </p>
                  </li>
                ))}
              </ul>
            </form>
            <Button onClick={handleClick} disabled={isSubmitDisabled}>
              Start spillet!
            </Button>
          </div>
        </div>
      )}
    </Main>
  );
};

export default CreateCharacter;
