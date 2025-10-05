// /Functions/JailFunctions.ts
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { arrest } from "./RewardFunctions"; // same as before
import { serverNow } from "./serverTime";

export const BRIBE_COST = 10_000;
export const CHANCE_BRIBE = 0.6;
export const CHANCE_BREAKOUT = 0.35;

function normalizeTs(val: any): Timestamp | null {
  if (!val) return null;
  if (typeof val.toMillis === "function") return val as Timestamp;
  if (typeof val.seconds === "number" && typeof val.nanoseconds === "number") {
    return new Timestamp(val.seconds, val.nanoseconds);
  }
  if (typeof val === "number") return Timestamp.fromMillis(val);
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

export async function isStillJailed(targetId: string): Promise<boolean> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "Characters", targetId));
  if (!snap.exists()) return false;
  const v = snap.data() as any;
  if (!v.inJail) return false;
  const ts = normalizeTs(v.jailReleaseTime);
  return !!ts && ts.toMillis() > serverNow();
}

export async function freeTarget(targetId: string): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, "Characters", targetId), {
    inJail: false,
    jailReleaseTime: null,
  });
}

export type JailActionResult =
  | { ok: true; freed: true; charged?: number }
  | {
      ok: false;
      reason: "NOT_JAILED" | "NO_FUNDS" | "FAILED_AND_JAILED" | "ERROR";
      charged?: number;
    };

export async function bribeRelease(
  actor: any,
  targetId: string
): Promise<JailActionResult> {
  const db = getFirestore();
  if (!(await isStillJailed(targetId)))
    return { ok: false, reason: "NOT_JAILED" };

  const money: number = actor?.stats?.money ?? 0;
  if (money < BRIBE_COST) return { ok: false, reason: "NO_FUNDS" };

  // charge
  await updateDoc(doc(db, "Characters", actor.id), {
    "stats.money": Math.max(0, money - BRIBE_COST),
  });

  const success = Math.random() < CHANCE_BRIBE;
  if (success) {
    await freeTarget(targetId);
    return { ok: true, freed: true, charged: BRIBE_COST };
  } else {
    await arrest(actor);
    return { ok: false, reason: "FAILED_AND_JAILED", charged: BRIBE_COST };
  }
}

export async function breakoutRelease(
  actor: any,
  targetId: string
): Promise<JailActionResult> {
  if (!(await isStillJailed(targetId)))
    return { ok: false, reason: "NOT_JAILED" };

  const success = Math.random() < CHANCE_BREAKOUT;
  if (success) {
    await freeTarget(targetId);
    return { ok: true, freed: true };
  } else {
    await arrest(actor);
    return { ok: false, reason: "FAILED_AND_JAILED" };
  }
}
