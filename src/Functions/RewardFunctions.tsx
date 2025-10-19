import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  query,
  where,
  limit,
  getDocs,
  writeBatch,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";
import { serverNow, serverTimeReady } from "./serverTime";

import { getItemById } from "../Data/Items";

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
  xpReward?: number;
  moneyReward?: number;
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
    if (character.stats.heat >= 50) return;

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
    await serverTimeReady;
    const characterRef = doc(db, "Characters", character.id);
    const jailDurationMs = 10_000 + (character?.stats?.heat ?? 0) * 5_000;
    const releaseMs = serverNow() + jailDurationMs;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(characterRef);
      if (!snap.exists()) throw new Error("Character not found");
      tx.update(characterRef, {
        inJail: true,
        jailReleaseTime: Timestamp.fromMillis(releaseMs),
        "stats.heat": 0,
        lastActive: serverTimestamp(),
      });
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
      jailReleaseTime: Timestamp.fromMillis(Date.now() - 1000),
    });
  } catch (error) {
    console.error("Feil ved utbrytning:", error);
  }
};

export async function grantItemToInventory(
  characterId: string,
  itemId: string,
  qty: number = 1
): Promise<void> {
  if (!characterId || !itemId || qty <= 0) return;

  const it = getItemById(itemId);
  if (!it) throw new Error(`Unknown itemId: ${itemId}`);

  const itemsCol = collection(db, "Characters", characterId, "items");
  const isStackable = !!(it as any).stackable;

  if (isStackable) {
    // Find ANY existing stack doc for this itemId (by catalog id).
    // We use a normal query here; if two clients race, at worst you’ll end up with 2 stacks,
    // which is acceptable since you want the ability to split stacks later anyway.
    const q = query(itemsCol, where("id", "==", it.id), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Increment quantity on the first matching stack
      const stackRef = snap.docs[0].ref;
      await updateDoc(stackRef, {
        quantity: increment(qty),
        lastAcquiredAt: serverTimestamp(),
      });
    } else {
      // Create a new stack doc (auto-id)
      const newRef = doc(itemsCol);
      await setDoc(newRef, {
        // canonical metadata
        id: it.id,
        name: it.name,
        slot: (it as any).slot ?? null,
        tier: it.tier ?? 1,
        value: it.value ?? 0,
        img: (it as any).img ?? null,
        attack: (it as any).attack ?? 0,

        // stack data
        quantity: qty,

        // bookkeeping
        createdAt: serverTimestamp(),
        lastAcquiredAt: serverTimestamp(),
      });
    }
    return;
  }

  // Non-stackable: create one doc per unit
  // (You can batch these for efficiency if qty is large.)
  const batch = writeBatch(db);
  for (let i = 0; i < qty; i++) {
    const ref = doc(itemsCol); // auto-id
    batch.set(ref, {
      id: it.id,
      name: it.name,
      slot: (it as any).slot ?? null,
      tier: it.tier ?? 1,
      value: it.value ?? 0,
      img: (it as any).img ?? null,
      attack: (it as any).attack ?? 0,

      quantity: 1,
      createdAt: serverTimestamp(),
      lastAcquiredAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

/**
 * Convenience: grant multiple items (small lists).
 * Iterates sequentially so each item can query/update its stack safely.
 */
export async function grantItemsToInventory(
  characterId: string,
  entries: Array<{ itemId: string; qty: number }>
): Promise<void> {
  for (const { itemId, qty } of entries) {
    if (qty > 0) {
      // eslint-disable-next-line no-await-in-loop
      await grantItemToInventory(characterId, itemId, qty);
    }
  }
}
