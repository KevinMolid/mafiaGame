import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

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

const Assassinate = () => {
  const [targetPlayer, setTargetPlayer] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");

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
        // Assassinate
        setMessage(`Player ${targetPlayer} was successfully assassinated!`);
        setMessageType("success");

        const targetDocId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "Characters", targetDocId), { status: "dead" });
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
    <section>
      <H1>Assassinate player</H1>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <H2>Who would you like to assassinate?</H2>
      <div className="flex flex-col gap-2 ">
        <input
          type="text"
          placeholder="Player name"
          value={targetPlayer}
          onChange={handleTargetInput}
          className="bg-neutral-700 px-4 py-2 text-white"
        />
        <Button onClick={killPlayer}>Kill player</Button>
      </div>
    </section>
  );
};

export default Assassinate;
