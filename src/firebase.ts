// firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import firebaseConfig from "./firebaseConfig";
import { initServerTime } from "./Functions/serverTime";

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
initServerTime(app);
