import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import Box from "../../components/Box";

import { useCharacter } from "../../CharacterContext";
import { Character } from "../../Interfaces/CharacterTypes";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
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
  const [helpActive, setHelpActive] = useState(false);
  const { character } = useCharacter();

  // Function to commit robbery
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (!character || !character.id) {
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
        // Check if the target has at least $100
        if (randomTarget.stats.money < 100) {
          setMessage(
            `Target ${randomTarget.username} was found but had no money to steal.`
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
      <div className="flex justify-between">
        <H1>Robbery</H1>
        {!helpActive && (
          <i
            className="hover:text-yellow-400 text-2xl fa-solid fa-question cursor-pointer"
            onClick={() => setHelpActive(true)}
          ></i>
        )}
      </div>

      <p className="mb-4">
        Here you can steal money from a random player in your location, or
        attempt to rob a player of your choosing.
      </p>

      {/* Help box */}
      {helpActive && (
        <div className="mb-4">
          <Box>
            <div className="grid grid-cols-[max-content_auto_max-content] gap-4">
              <div className="flex justify-center items-center">
                <i className="text-yellow-400 text-2xl fa-solid fa-question"></i>
              </div>
              <small>
                There is a 50% chance of finding a random target player. If
                target player has $100 or more, you will steal 10-50% of the
                targets money.
              </small>
              <i
                className="fa-solid fa-x hover:text-neutral-200 cursor-pointer"
                onClick={() => setHelpActive(false)}
              ></i>
            </div>
          </Box>
        </div>
      )}

      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <form onSubmit={handleSubmit} action="" className="mt-4">
        <Button type="submit">Commit Robbery</Button>
      </form>
    </section>
  );
};

export default Robbery;
