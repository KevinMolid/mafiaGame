import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const rewardXp = async (character: any, xp: number) => {
  const newXp = character.stats.xp + xp;
  const characterRef = doc(db, "Characters", character.id);
  await updateDoc(characterRef, {
    "stats.xp": newXp,
  });
};

// Update XP and Money in Firestore
export const giveReward = async (
  character: any,
  characterID: string,
  xp: number = 0,
  money: number = 0
) => {
  try {
    const characterRef = doc(db, "Characters", characterID);

    const newXp = character.stats.xp + xp;
    const newMoney = character.stats.money + money;

    await updateDoc(characterRef, {
      "stats.xp": newXp,
      "stats.money": newMoney,
    });

    return { xp: newXp, money: newMoney };
  } catch (error) {
    console.error("Feil ved oppdatering av belønning:", error);
  }
};

interface GainRewardParams {
  character: any;
  activeCharacter: string;
  xpReward?: number; // Optional XP reward
  moneyReward?: number; // Optional Money reward
  successMessage: string;
  failureMessage: string;
  successRate: number;
  setMessage: (message: string) => void;
  setMessageType: (type: "success" | "failure" | "info" | "warning") => void;
}

export const attemptReward = async ({
  character,
  activeCharacter,
  xpReward = 0, // Default to 0 if not provided
  moneyReward = 0, // Default to 0 if not provided
  successMessage,
  failureMessage,
  successRate,
  setMessage,
  setMessageType,
}: GainRewardParams) => {
  const success = Math.random() < successRate;

  if (success) {
    // Call giveReward and handle the result safely
    const rewardResult = await giveReward(
      character,
      activeCharacter,
      xpReward,
      moneyReward
    );

    // Ensure rewardResult is not undefined before destructuring
    if (rewardResult) {
      // Format the success message to include both XP and money (if applicable)
      const rewardMessage = `${successMessage}${
        xpReward && moneyReward
          ? ` Du fikk $${moneyReward} og ${xpReward} XP`
          : xpReward
          ? ` Du fikk ${xpReward} XP`
          : moneyReward
          ? ` Du fikk $${moneyReward}`
          : ""
      }!`;

      setMessage(rewardMessage.trim());
      setMessageType("success");
    } else {
      // Handle the case where rewardResult is undefined (e.g., an error occurred)
      setMessage("Feil ved oppdatering av belønning. Prøv igjen.");
      setMessageType("failure");
    }
  } else {
    // Set failure message
    setMessage(failureMessage);
    setMessageType("failure");
  }
};

export const increaseHeat = async (
  character: any,
  characterID: string,
  heat: number = 0
) => {
  try {
    const characterRef = doc(db, "Characters", characterID);

    const newHeat = character.stats.heat + heat;

    await updateDoc(characterRef, {
      "stats.heat": newHeat,
    });
  } catch (error) {
    console.error("Feil ved oppdatering av Ettersøktnivå:", error);
  }
};

export const resetHeat = async (characterID: string) => {
  try {
    const characterRef = doc(db, "Characters", characterID);

    await updateDoc(characterRef, {
      "stats.heat": 0,
    });
  } catch (error) {
    console.error("Feil ved oppdatering av Ettersøktnivå:", error);
  }
};

export const arrest = async (character: any) => {
  try {
    const characterRef = doc(db, "Characters", character.id);
    const jailDuration = 20000 + character.stats.heat * 10 * 1000; // 20 sec + heat * 10 seconds in milliseconds
    const jailReleaseTime = new Date().getTime() + jailDuration;
    await updateDoc(characterRef, {
      inJail: true,
      jailReleaseTime: jailReleaseTime,
      "stats.heat": 0,
    });
  } catch (error) {
    console.error("Feil ved arrestering:", error);
  }
};

export const breakOut = async (characterID: string) => {
  try {
    const characterRef = doc(db, "Characters", characterID);
    await updateDoc(characterRef, {
      inJail: false,
    });
  } catch (error) {
    console.error("Feil ved utbrytning:", error);
  }
};
