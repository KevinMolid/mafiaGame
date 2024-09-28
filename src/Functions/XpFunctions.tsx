import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const giveXP = async (character: any, xp: number) => {
  try {
    // Reference to the player's document in Firestore
    const characterRef = doc(db, "characters", character.id);

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
