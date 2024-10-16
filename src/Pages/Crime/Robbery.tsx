import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

import { useCharacter } from "../../CharacterContext";
import { Character } from "../../Interfaces/CharacterTypes";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import firebaseConfig from "../../firebaseConfig";
import { useState } from "react";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Robbery = () => {
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const { character } = useCharacter();

  // Function to commit robbery
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (!character) {
        setMessage("Character not found.");
        setMessageType("warning");
        return;
      }

      // Find players in same location
      const charactersRef = query(
        collection(db, "Characters"),
        where("location", "==", character?.location)
      );

      const charactersSnapshot = await getDocs(charactersRef);

      // Filter out the current player
      const potentialTargets = charactersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Character) }))
        .filter((char: any) => char.id !== character?.id);

      if (potentialTargets.length === 0) {
        setMessage("No players available to rob in this location.");
        setMessageType("warning");
        return;
      }

      // Randomly select a target from the remaining players
      const randomTarget =
        potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

      const successChance = Math.random();
      if (successChance > 0.5) {
        // Example: Transfer money from target to current player
        const stolenAmount = Math.floor(Math.random() * 500); // Example: rob up to $500
        setMessage(
          `Success! You robbed ${randomTarget.username} for $${stolenAmount}.`
        );
        setMessageType("success");
      } else {
        setMessage("Robbery failed. Better luck next time!");
        setMessageType("failure");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section>
      <H1>Robbery</H1>
      <p className="mb-2">
        Here you can steal money from a random player in your location, or
        attempt to rob a player of your choosing.
      </p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <form onSubmit={handleSubmit} action="" className="mt-4">
        <Button type="submit">Commit Robbery</Button>
      </form>
    </section>
  );
};

export default Robbery;
