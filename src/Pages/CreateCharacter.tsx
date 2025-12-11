// Components
import Button from "../components/Button";
import Main from "../components/Main";

import Airport from "/images/scenes/Airport.jpg";

// React
import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";

// Context
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

// Firebase
import {
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

import { db } from "../firebase";

const cities = ["Mexico City", "New York", "Moskva", "Rio de Janeiro", "Tokyo"];

// Intro text steps
const INTRO_TEXTS = [
  "Flyplassen summer rundt deg... Du står alene, med akkurat nok penger til én billett.",
  "Dette er starten på et nytt liv. En mulighet... En siste sjanse.",
  "Men før du tar steget ut, trenger du et nytt navn. En ny identitet.",
  "Et godt navn. Pass godt på det. For her ute er ryktet alt.",
  "Ingen kommer til å savne deg der du kommer fra. Og dit du skal... Der vet ingen hvem du er.",
  "Ta et siste pust. Du kan bli en fremtidig legende… eller et nytt lik i statistikken. Velkommen til livet du valgte.",
];

// All steps that should have typewriter text
const STEP_TEXT: Partial<Record<number, string>> = {
  0: INTRO_TEXTS[0],
  1: INTRO_TEXTS[1],
  2: INTRO_TEXTS[2],
  3: "Hva vil du kalle deg?",
  4: INTRO_TEXTS[3],
  5: INTRO_TEXTS[4],
  6: "Hvor vil du starte ditt nye liv?",
  7: INTRO_TEXTS[5],
};

const TYPING_SPEED_MS = 30; // hastighet per bokstav

const CreateCharacter = () => {
  const { user, userData, setUserData } = useAuth();
  const { userCharacter, setUserCharacter } = useCharacter();

  // Steg:
  // 0,1,2 = tekst
  // 3     = brukernavn
  // 4,5   = tekst
  // 6     = byvalg
  // 7     = tekst + "Start spillet"
  const [step, setStep] = useState(0);

  const [location, setLocation] = useState<string>(() => {
    const i = Math.floor(Math.random() * cities.length);
    return cities[i];
  });
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  type NameStatus = "idle" | "checking" | "available" | "taken" | "invalid";
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");
  const lastCheckedRef = useRef<string>("");

  const navigate = useNavigate();

  // Typewriter-state
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<number | null>(null);

  // Controls fade-in for username & city selection after typing
  const [extrasVisible, setExtrasVisible] = useState(false);

  // Block hvis karakter allerede lever
  if (
    userData.type !== "admin" &&
    userCharacter &&
    userCharacter.status === "alive"
  ) {
    return <Navigate to="/" />;
  }

  /* ---------------- Username handling ---------------- */

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
    setError("");
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

  // Debounced live availability check
  useEffect(() => {
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
        if (lastCheckedRef.current !== candidate) return;

        setNameStatus(unique ? "available" : "taken");
        if (!unique) setError("Brukernavnet finnes allerede.");
        else setError("");
      } catch {
        if (lastCheckedRef.current !== candidate) return;
        setNameStatus("invalid");
      }
    }, 400);

    return () => clearTimeout(t);
  }, [username]);

  const isUsernameSubmitDisabled =
    nameStatus !== "available" || !!error || username.length === 0;

  /* ---------------- Character creation ---------------- */

  async function createCharacterAndStart() {
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

  /* ---------------- Typewriter logic ---------------- */

  const hasStepText = STEP_TEXT[step] !== undefined;

  // Helper to fully reveal current text & stop animation
  function skipTyping() {
    if (!hasStepText) return;
    const fullText = STEP_TEXT[step] ?? "";
    if (!fullText) return;

    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setDisplayedText(fullText);
    setIsTyping(false);
  }

  // Reset extras visibility on step change
  useEffect(() => {
    setExtrasVisible(false);
  }, [step]);

  useEffect(() => {
    const fullText = STEP_TEXT[step] ?? "";

    // Clear any previous interval
    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (!fullText) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);

    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        setIsTyping(false);
        window.clearInterval(id);
        typingIntervalRef.current = null;
      }
    }, TYPING_SPEED_MS);

    typingIntervalRef.current = id;

    return () => {
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [step]);

  // When typing finishes on the username or city step, fade in extras
  // Reset extras visibility on step change
  useEffect(() => {
    setExtrasVisible(false);
  }, [step]);

  // When typing REALLY finishes on username/city step, fade in extras
  useEffect(() => {
    const fullText = STEP_TEXT[step] ?? "";

    const shouldShowExtras =
      !isTyping && // typewriter has stopped
      (step === 3 || step === 6) && // only username / city steps
      fullText.length > 0 &&
      displayedText === fullText; // full text is actually shown

    if (shouldShowExtras) {
      setExtrasVisible(true);
    }
  }, [isTyping, step, displayedText]);

  /* ---------------- Navigation logic ---------------- */

  function handleNext() {
    // If text is still typing, first click just skips animation
    if (isTyping) {
      skipTyping();
      return;
    }

    // Username step: ikke gå videre hvis ugyldig
    if (step === 3 && isUsernameSubmitDisabled) {
      if (!username) {
        setError("Du må skrive inn et brukernavn.");
      }
      return;
    }

    // Siste steg -> opprett karakter
    if (step === 7) {
      void createCharacterAndStart();
      return;
    }

    setStep((prev) => Math.min(prev + 1, 7));
  }

  function handlePrev() {
    // First click while typing = skip animation
    if (isTyping) {
      skipTyping();
      return;
    }
    setStep((prev) => Math.max(prev - 1, 0));
  }

  // Click on text area: skip typing OR go to next step
  function handleTextClick() {
    if (isTyping) {
      skipTyping();
    } else {
      handleNext();
    }
  }

  // Keyboard navigation, men IKKE når bruker skriver i input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const isNavKey =
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft";

      if (!isNavKey) return;

      e.preventDefault();

      if (isTyping) {
        skipTyping();
        return;
      }

      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    step,
    isTyping,
    isUsernameSubmitDisabled,
    username,
    location,
    nameStatus,
    error,
  ]);

  /* ---------------- UI helpers ---------------- */

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

  function renderStepContent() {
    // Tekst-steg 0,1,2,4,5,7 – ren tekst fra typewriter
    if ([0, 1, 2, 4, 5, 7].includes(step)) {
      return (
        <div className="w-full max-w-xl">
          <p
            className="text-lg sm:text-xl font-medium leading-snug cursor-pointer"
            onClick={handleTextClick}
          >
            {displayedText}
          </p>
        </div>
      );
    }

    // Step 3: brukernavn (typewriter på overskriften)
    if (step === 3) {
      return (
        <div className="w-full max-w-xl">
          <p
            className="text-lg sm:text-xl font-medium leading-snug mb-2 cursor-pointer"
            onClick={handleTextClick}
          >
            {displayedText}
          </p>

          <div
            className={`transition-opacity duration-[400ms] ${
              extrasVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <input
              className={
                "w-full bg-transparent border-b text-2xl font-medium text-white placeholder-neutral-500 focus:outline-none mt-2 " +
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
              onClick={(e) => e.stopPropagation()}
            />
            <div className="min-h-[1.5rem] mt-2">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <UsernameHint />
              )}
            </div>
          </div>
        </div>
      );
    }

    // Step 6: byvalg (typewriter på overskriften)
    if (step === 6) {
      return (
        <div className="w-full max-w-xl">
          <p
            className="text-lg sm:text-xl font-medium leading-snug mb-6 cursor-pointer"
            onClick={handleTextClick}
          >
            {displayedText}
          </p>
          <div
            className={`transition-opacity duration-[400ms] ${
              extrasVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex gap-2 flex-wrap mt-2 mb-2">
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
          </div>
        </div>
      );
    }

    return null;
  }

  const totalSteps = 8; // 0–7
  const isNextDisabled = step === 3 && isUsernameSubmitDisabled;

  return (
    <Main>
      <div className="w-full max-w-4xl mx-auto">
        {/* Scene image */}
        <img
          src={Airport}
          alt="Flyplass"
          className="w-full max-w-xl h-full max-h-[400px] object-cover mx-auto border border-neutral-600 cursor-pointer"
          onClick={() => {
            if (isTyping) skipTyping();
          }}
        />

        {/* Intro content */}
        <div className="w-full text-neutral-100 px-4 flex flex-col">
          {/* Fixed-height area between image and buttons */}
          <div className="w-full max-w-xl mx-auto flex flex-col min-h-[160px] mt-4">
            {/* Content area (text / username / city selector) */}
            <div className="flex-1 overflow-y-auto flex justify-center">
              {renderStepContent()}
            </div>

            {/* Navigation row pinned to bottom of this area */}
            <div className="pt-4">
              <div className="w-full flex items-center justify-between gap-2">
                {/* Dots */}
                <div className="flex justify-center gap-1">
                  {Array.from({ length: totalSteps }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-2 w-2 rounded-full ${
                        idx === step ? "bg-neutral-300" : "bg-neutral-600"
                      }`}
                      aria-hidden
                    />
                  ))}
                </div>

                {/* Neste / Start spillet */}
                <div className="shrink-0 flex gap-2">
                  <Button
                    type="button"
                    size="small"
                    style="black"
                    disabled={step === 0}
                    onClick={handlePrev}
                  >
                    Forrige
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    style="black"
                    onClick={handleNext}
                    disabled={isNextDisabled}
                  >
                    {step === 7 ? "Start spillet" : "Neste"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Main>
  );
};

export default CreateCharacter;
