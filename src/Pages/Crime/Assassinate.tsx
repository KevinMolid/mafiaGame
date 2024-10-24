import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

// React
import { useState } from "react";

// Firebase
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

const db = getFirestore();

import { useCharacter } from "../../CharacterContext";

const Assassinate = () => {
  const [targetPlayer, setTargetPlayer] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const { character } = useCharacter();

  // Function to handle assassination
  const killPlayer = async () => {
    if (!targetPlayer) {
      setMessage("Please enter a player name.");
      setMessageType("warning");
      return;
    }

    try {
      // Query the "Characters" collection for a player with the matching username
      const q = query(
        collection(db, "Characters"),
        where("username", "==", targetPlayer)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No player found
        setMessage(`Player ${targetPlayer} does not exist.`);
        setMessageType("warning");
      } else {
        const playerData = querySnapshot.docs[0].data();
        const targetDocId = querySnapshot.docs[0].id;

        if (character?.username === playerData.username) {
          // Suicide
          setMessage(`You can't kill yourself!`);
          setMessageType("warning");
        } else if (playerData.status === "dead") {
          // Player is already dead
          setMessage(`${targetPlayer} is already dead!`);
          setMessageType("warning");
        } else if (character?.location !== playerData.location) {
          // Player is not in same city
          setMessage(
            `You could not find ${targetPlayer} in ${character?.location}!`
          );
          setMessageType("failure");
        } else {
          // Proceed with assassination
          setMessage(`${targetPlayer} was successfully assassinated!`);
          setMessageType("success");

          // Update player status to 'dead'
          await updateDoc(doc(db, "Characters", targetDocId), {
            status: "dead",
          });
        }
      }
    } catch (error) {
      // Handle any errors during the query
      console.error("Error checking target player:", error);
      setMessage("An error occurred while trying to assassinate the player.");
      setMessageType("failure");
    }
  };

  const handleTargetInput = (event: any) => {
    setTargetPlayer(event.target.value);
  };

  return (
    <Main>
      <H1>Drep spiller</H1>
      <p className="mb-4">Her kan du forsøke å drepe en annen spiller.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <H2>Hvem vil du drepe?</H2>
      <div className="flex flex-col gap-2 ">
        <input
          type="text"
          placeholder="Brukernavn"
          value={targetPlayer}
          onChange={handleTargetInput}
          className="bg-neutral-700 px-4 py-2 text-white placeholder-neutral-400"
        />
        <div>
          <Button onClick={killPlayer}>Angrip spiller</Button>
        </div>
      </div>
    </Main>
  );
};

export default Assassinate;
