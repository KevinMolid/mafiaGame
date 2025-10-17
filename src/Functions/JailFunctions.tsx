import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  deleteField,
  increment,
  getDocFromServer,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { arrest } from "./RewardFunctions";
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

export async function releaseIfExpired(characterId: string): Promise<boolean> {
  const db = getFirestore();
  const ref = doc(db, "Characters", characterId);

  // Fresh read (fallback to cached if offline)
  const snap = await getDocFromServer(ref).catch(() => getDoc(ref));
  if (!snap.exists()) return false;

  const data = snap.data() as any;
  if (!data?.inJail) return false;

  const ts = normalizeTs(data.jailReleaseTime);
  const expired = !ts || ts.toMillis() <= serverNow();
  if (!expired) return false;

  try {
    await updateDoc(ref, {
      inJail: false,
      jailReleaseTime: deleteField(),
    });
    return true;
  } catch (e: any) {
    // If another writer already released them between our read and write,
    // we can treat that as success.
    if (e?.code === "failed-precondition" || e?.code === "aborted") {
      return true;
    }
    console.error("[jail] releaseIfExpired update failed:", e);
    return false;
  }
}

export async function freeTarget(targetId: string): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, "Characters", targetId), {
    inJail: false,
    jailReleaseTime: deleteField(),
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
  const actorRef = doc(db, "Characters", actor.id);

  // First make sure target is actually jailed right now
  if (!(await isStillJailed(targetId)))
    return { ok: false, reason: "NOT_JAILED" };

  try {
    // Charge atomically with a funds check
    await runTransaction(db, async (tx) => {
      const aSnap = await tx.get(actorRef);
      if (!aSnap.exists()) throw new Error("Actor not found");
      const a = aSnap.data() as any;
      const money: number = a?.stats?.money ?? 0;
      if (money < BRIBE_COST) throw new Error("NO_FUNDS");
      tx.update(actorRef, { "stats.money": increment(-BRIBE_COST) });
    });
  } catch (e: any) {
    if (e?.message === "NO_FUNDS") return { ok: false, reason: "NO_FUNDS" };
    return { ok: false, reason: "ERROR" };
  }

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
