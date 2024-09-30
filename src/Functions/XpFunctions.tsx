import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const giveXP = async (
  character: any,
  characterID: string,
  xp: number
) => {
  try {
    // Reference to the player's document in Firestore
    const characterRef = doc(db, "Characters", characterID);

    // Get the current XP and add the new XP
    const newXp = character.stats.xp + xp;

    // Update the XP in Firestore
    await updateDoc(characterRef, {
      "stats.xp": newXp,
    });

    // Optionally, return the updated XP or character data if needed
    return newXp;
  } catch (error) {
    console.error("Error updating XP:", error);
  }
};

interface GainXPParams {
  character: any;
  activeCharacter: string;
  xpReward: number;
  successMessage: string;
  failureMessage: string;
  successRate: number;
  setCharacter: (value: any) => void;
  setMessage: (message: string) => void;
  setMessageType: (type: "success" | "failure" | "info" | "warning") => void;
}

export const attemptXPReward = async ({
  character,
  activeCharacter,
  xpReward,
  successMessage,
  failureMessage,
  successRate,
  setCharacter,
  setMessage,
  setMessageType,
}: GainXPParams) => {
  const success = Math.random() < successRate;
  if (success) {
    // Call giveXP and update the character XP
    const updatedXP = await giveXP(character, activeCharacter, xpReward);

    // Update the character with the new XP
    setCharacter((prevCharacter: any) => ({
      ...prevCharacter,
      stats: {
        ...prevCharacter.stats,
        xp: updatedXP,
      },
    }));

    // Set success message
    setMessage(successMessage);
    setMessageType("success");
  } else {
    // Set failure message
    setMessage(failureMessage);
    setMessageType("failure");
  }
};
