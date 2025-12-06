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

/**
 * Simple XP reward helper – kept for backwards compatibility.
 * Uses applyStatRewards under the hood.
 */
export const rewardXp = async (character: any, xp: number) => {
  if (!character?.id || xp === 0) return;
  await applyStatRewards(character.id, { xp });
};

/**
 * Generic reward for XP, money and diamonds.
 * Uses Firestore increment() to avoid race conditions.
 */
export const giveReward = async (
  characterID: string,
  xp: number = 0,
  money: number = 0,
  diamonds: number = 0
) => {
  await applyStatRewards(characterID, { xp, money, diamonds });
};

interface GainRewardParams {
  character: any; // kept for compatibility, currently not used
  activeCharacter: string;
  xpReward?: number;
  moneyReward?: number;
  diamondsReward?: number;
  successMessage: string;
  failureMessage: string;
  successRate: number;
  setMessage: (message: string) => void;
  setMessageType: (type: "success" | "failure" | "info" | "warning") => void;
}

interface StatRewardOptions {
  xp?: number;
  money?: number;
  diamonds?: number;
}

/**
 * Core stat-reward function. One Firestore write, atomic update.
 */
export const applyStatRewards = async (
  characterID: string,
  rewards: StatRewardOptions
) => {
  if (!characterID) return;

  const { xp = 0, money = 0, diamonds = 0 } = rewards;

  // If nothing to give, skip the write
  if (xp === 0 && money === 0 && diamonds === 0) return;

  try {
    const characterRef = doc(db, "Characters", characterID);

    const updates: Record<string, any> = {};

    if (xp !== 0) {
      updates["stats.xp"] = increment(xp);
    }
    if (money !== 0) {
      updates["stats.money"] = increment(money);
    }
    if (diamonds !== 0) {
      updates["stats.diamonds"] = increment(diamonds);
    }

    await updateDoc(characterRef, updates);
  } catch (error) {
    console.error("Feil ved oppdatering av belønning:", error);
    throw error;
  }
};

/**
 * Attempt a reward with successRate.
 * On success, applies XP/money/diamonds and sets a formatted message.
 */
export const attemptReward = async ({
  activeCharacter,
  xpReward = 0,
  moneyReward = 0,
  diamondsReward = 0,
  successMessage,
  failureMessage,
  successRate,
  setMessage,
  setMessageType,
}: GainRewardParams) => {
  const success = Math.random() < successRate;

  if (!success) {
    setMessage(failureMessage);
    setMessageType("failure");
    return;
  }

  try {
    await giveReward(activeCharacter, xpReward, moneyReward, diamondsReward);

    const rewardParts: string[] = [];

    if (moneyReward) rewardParts.push(`$${moneyReward}`);
    if (xpReward) rewardParts.push(`${xpReward} XP`);
    if (diamondsReward) rewardParts.push(`${diamondsReward} diamanter`);

    const extra =
      rewardParts.length > 0 ? ` Du fikk ${rewardParts.join(" og ")}!` : "!";

    setMessage(`${successMessage}${extra}`);
    setMessageType("success");
  } catch (error) {
    console.error("Feil ved oppdatering av belønning:", error);
    setMessage("Feil ved oppdatering av belønning. Prøv igjen.");
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
        type: (it as any).type ?? null,

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

// Calculate damaged objects
export type Damageable = { value?: number | null; damage?: number | null };

/** Clamp damage to 0–100 (integer). */
export function dmgPercent(damage: number | null | undefined): number {
  const n = Math.floor(Number(damage ?? 0));
  return Math.min(100, Math.max(0, n));
}

/** Calculate value after damage using: value * (100 - damage) / 100. Rounded to nearest int. */
export function valueAfterDamage(
  baseValue: number | null | undefined,
  damage: number | null | undefined
): number {
  const v = Math.max(0, Number(baseValue ?? 0));
  const d = dmgPercent(damage);
  return Math.round((v * (100 - d)) / 100);
}

/** Convenience: pass a car-like object { value, damage }. */
export function carValue(car: Damageable | null | undefined): number {
  if (!car) return 0;
  return valueAfterDamage(car.value, car.damage);
}
