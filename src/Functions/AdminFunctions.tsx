// /Functions/AdminFunctions.ts
import {
  getFirestore,
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

type RoleName = "admin" | "moderator";
type GameEventType = "newRole" | "removeRole";

async function addRoleAlert(
  targetId: string,
  actorId: string,
  actorName: string,
  type: "newRole" | "removeRole",
  role: RoleName
) {
  const db = getFirestore();
  await addDoc(collection(db, "Characters", targetId, "alerts"), {
    read: false,
    userId: actorId,
    userName: actorName,
    timestamp: serverTimestamp(),
    type,
    ...(type === "newRole" ? { newRole: role } : { removedRole: role }),
  });
}

async function logGameEvent(
  userId: string,
  userName: string,
  actorId: string,
  actorName: string,
  eventType: GameEventType,
  role: RoleName
) {
  const db = getFirestore();
  await addDoc(collection(db, "GameEvents"), {
    userId,
    userName,
    actorId,
    actorName,
    eventType,
    role,
    timestamp: serverTimestamp(),
  });
}

export async function setXp(characterId: string, newValue: number) {
  const db = getFirestore();
  await updateDoc(doc(db, "Characters", characterId), { "stats.xp": newValue });
}
export async function setMoney(characterId: string, newValue: number) {
  const db = getFirestore();
  await updateDoc(doc(db, "Characters", characterId), {
    "stats.money": newValue,
  });
}
export async function setBank(characterId: string, newValue: number) {
  const db = getFirestore();
  await updateDoc(doc(db, "Characters", characterId), {
    "stats.bank": newValue,
  });
}

export async function setRole(
  character: { id: string; username: string },
  actor: { id: string; username: string },
  role: RoleName | ""
) {
  const db = getFirestore();
  const type = role ? "newRole" : "removeRole";
  await updateDoc(doc(db, "Characters", character.id), { role });
  await logGameEvent(
    character.id,
    character.username,
    actor.id,
    actor.username,
    type === "newRole" ? "newRole" : "removeRole",
    (role || "admin") as RoleName
  );
  await addRoleAlert(
    character.id,
    actor.id,
    actor.username,
    type as any,
    (role || "admin") as RoleName
  );
}

export async function setStatus(characterId: string, status: "alive" | "dead") {
  const db = getFirestore();
  await updateDoc(doc(db, "Characters", characterId), {
    status,
    ...(status === "dead" ? { diedAt: serverTimestamp() } : {}),
  });
}
