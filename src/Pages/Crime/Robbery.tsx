// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import Box from "../../components/Box";

// Functions
import { rewardXp } from "../../Functions/RewardFunctions";

// Context
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";
import { useCharacter } from "../../CharacterContext";
import { Target } from "../../Interfaces/CharacterTypes";

// React
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Robbery = () => {
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [helpActive, setHelpActive] = useState(false);
  const [targetCharacter, setTargetCharacter] = useState<string>("");
  const [isTargetRandom, setIsTargetRandom] = useState<boolean>(true);

  const { userData } = useAuth();
  const { character } = useCharacter();
  const { cooldowns, startCooldown, fetchCooldown } = useCooldown();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.activeCharacter && cooldowns["gta"] === undefined) {
      // Fetch cooldown only if it hasn't been fetched yet
      fetchCooldown("robbery", 300, userData.activeCharacter);
    }
  }, [userData, navigate, cooldowns, fetchCooldown]);

  // Updaate target state
  const handleTargetCharacterInputChange = (e: any) => {
    setTargetCharacter(e.target.value);
  };

  // Function to commit robbery
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!character || !character.id) {
      setMessageType("failure");
      setMessage("Spilleren ble ikke lastet.");
      return;
    }

    if (cooldowns["robbery"] > 0) {
      setMessageType("warning");
      setMessage("Du må vente før du kan utføre et nytt ran.");
      return;
    }

    try {
      // Find players in same location
      const charactersRef = query(
        collection(db, "Characters"),
        where("location", "==", character?.location)
      );

      const charactersSnapshot = await getDocs(charactersRef);

      // Filter out the current player
      const potentialTargets = charactersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Target) }))
        .filter((char: any) => char.id !== character?.id);

      if (potentialTargets.length === 0) {
        setMessage("Du fant ingen spillere å rane i denne byen.");
        setMessageType("warning");
        return;
      }

      // Randomly select a target from the remaining players
      const randomTarget =
        potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

      const successChance = Math.random();
      if (successChance > 0.5) {
        // Check if the target has at least $100
        if (randomTarget.stats.money < 100) {
          setMessage(
            `Du prøvde å rane ${randomTarget.username}, men fant ingen ting å stjele.`
          );
          setMessageType("warning");
          return;
        }

        // Calculate the amount to steal (between 10% and 50% of the target's money)
        const stealPercentage = Math.random() * (0.5 - 0.1) + 0.1;
        const stolenAmount = Math.floor(
          randomTarget.stats.money * stealPercentage
        );

        // Update target's money
        const targetDocRef = doc(db, "Characters", randomTarget.id);
        await updateDoc(targetDocRef, {
          "stats.money": randomTarget.stats.money - stolenAmount,
        });

        // Update player's money
        const playerDocRef = doc(db, "Characters", character.id);
        await updateDoc(playerDocRef, {
          "stats.money": character.stats.money + stolenAmount,
        });

        // Add an alert to the target player's alerts sub-collection
        const alertRef = collection(
          db,
          "Characters",
          randomTarget.id,
          "alerts"
        );
        await addDoc(alertRef, {
          type: "robbery",
          timestamp: new Date().toISOString(),
          amountLost: stolenAmount,
          robberName: character.username,
          robberId: character.id,
          read: false,
        });

        rewardXp(character, 10);

        setMessage(
          `Du ranet ${
            randomTarget.username
          } for $${stolenAmount.toLocaleString()}.`
        );
        setMessageType("success");
      } else {
        setMessage(
          `Du prøvde å rane ${randomTarget.username}, men feilet. Bedre lykke neste gang!`
        );
        setMessageType("failure");
      }
    } catch (error) {
      console.error(error);
    } finally {
      // Start the cooldown after a robbery
      startCooldown(300, "robbery", character.id);
    }
  };

  return (
    <Main>
      <div className="flex items-baseline gap-4">
        <H1>Ran spiller</H1>
        {helpActive ? (
          <i
            className="text-yellow-400 text-2xl fa-solid fa-question cursor-pointer"
            onClick={() => setHelpActive(!helpActive)}
          ></i>
        ) : (
          <i
            className="hover:text-neutral-200 text-2xl fa-solid fa-question cursor-pointer"
            onClick={() => setHelpActive(!helpActive)}
          ></i>
        )}
      </div>

      <p className="mb-4">Her kan du rane andre spillere for penger.</p>

      {/* Help box */}
      {helpActive && (
        <div className="mb-4">
          <Box>
            <p>
              Du har 50% sjanse for å finne en annen spiller. Dersom spilleren
              har $100 eller mer, har du 50% sjanse til å stjele en del av
              spillerens penger.
            </p>
          </Box>
        </div>
      )}

      {cooldowns["robbery"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {cooldowns["robbery"]}
          </span>{" "}
          sekunder før du kan rane en spiller.
        </p>
      )}

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2" action="">
        <H2>Hvem vil du rane?</H2>
        <ul className="flex gap-2 flex-wrap">
          <li
            className={
              "border px-4 py-2 flex-grow text-center cursor-pointer max-w-64 " +
              (isTargetRandom
                ? "bg-neutral-900 border-neutral-600"
                : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
            }
            onClick={() => setIsTargetRandom(true)}
          >
            <p className={isTargetRandom ? "text-white" : ""}>
              Tilfeldig spiller
            </p>
          </li>
          <li
            className={
              "border px-4 py-2 flex-grow text-center cursor-pointer max-w-64 " +
              (isTargetRandom
                ? "bg-neutral-800 hover:bg-neutral-700 border-transparent"
                : "bg-neutral-900 border-neutral-600")
            }
            onClick={() => setIsTargetRandom(false)}
          >
            <p className={isTargetRandom ? "" : "text-white"}>
              Bestemt spiller
            </p>
          </li>
        </ul>

        {!isTargetRandom && (
          <input
            className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
            type="text"
            placeholder="Skriv inn brukernavn"
            value={targetCharacter}
            onChange={handleTargetCharacterInputChange}
          />
        )}

        <div>
          <Button type="submit">Utfør ran</Button>
        </div>
      </form>
    </Main>
  );
};

export default Robbery;
