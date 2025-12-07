// InventoryHelpers.ts
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

import { getItemById } from "../Data/Items";
import { getCarByKey /*, getCarByName, etc if needed */ } from "../Data/Cars";
import { carValue, dmgPercent } from "./RewardFunctions"; // or adjust path

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Firestore shapes ---

export interface ItemDoc {
  id: string; // catalog id (Items.tsx)
  type?: string | null; // e.g. "bullet"
  quantity?: number;
  [key: string]: any; // any extra dynamic fields later
}

export interface CarDoc {
  modelKey?: string | null; // new way (Cars.tsx)
  key?: string | null; // legacy
  name?: string | null; // legacy
  city?: string | null;
  damage?: number | null;
  stolenFrom?: string | null;
  [key: string]: any; // extra dynamic fields later
}

// --- Catalog types (adapt to your actual definitions) ---
export type ItemCatalogEntry = ReturnType<typeof getItemById>;
// if Cars.tsx exports a type, use that instead:
export type CarCatalogEntry = ReturnType<typeof getCarByKey>;

export interface HydratedItem {
  /** Firestore document id (instance id, not item catalog id) */
  docId: string;
  /** Raw instance data straight from Firestore */
  raw: ItemDoc;
  /** Static catalog definition from Items.tsx (may be null if unknown id) */
  catalog: ItemCatalogEntry | null;
  /** Convenience: quantity from raw or 1 */
  quantity: number;
}

export function hydrateItemDoc(docId: string, data: ItemDoc): HydratedItem {
  const catalog = getItemById(data.id) || null;

  return {
    docId,
    raw: data,
    catalog,
    quantity: typeof data.quantity === "number" ? data.quantity : 1,
  };
}

export async function loadCharacterItems(
  characterId: string
): Promise<HydratedItem[]> {
  if (!characterId) return [];

  const itemsCol = collection(db, "Characters", characterId, "items");
  // optional: order for stable UI
  const q = query(itemsCol, orderBy("lastAcquiredAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => hydrateItemDoc(d.id, d.data() as ItemDoc));
}

export function getCatalogForCarDoc(car: CarDoc): CarCatalogEntry | null {
  // New preferred field
  if (car.modelKey) {
    const c = getCarByKey(car.modelKey);
    if (c) return c;
  }

  // Legacy fallbacks if you still have old docs around
  if (car.key) {
    const c = getCarByKey(car.key);
    if (c) return c;
  }

  // If your Cars.tsx has getCarByName, you can use it here:
  // if (car.name) {
  //   const c = getCarByName(car.name);
  //   if (c) return c;
  // }

  return null;
}

export interface HydratedCar {
  /** Firestore document id for this specific car instance */
  docId: string;
  /** Raw Firestore data for the instance */
  raw: CarDoc;
  /** Static catalog entry (brand, model, base value, etc.) */
  catalog: CarCatalogEntry | null;
  /** Damage clamped 0–100 */
  damage: number;
  /** Calculated current value based on catalog value and damage */
  currentValue: number;
}

export function hydrateCarDoc(docId: string, data: CarDoc): HydratedCar {
  const catalog = getCatalogForCarDoc(data);

  const damage = dmgPercent(data.damage ?? 0);
  const baseValue =
    catalog && typeof (catalog as any).value === "number"
      ? (catalog as any).value
      : 0;

  const currentValue = carValue({
    value: baseValue,
    damage,
  });

  return {
    docId,
    raw: data,
    catalog,
    damage,
    currentValue,
  };
}

export async function loadCharacterCars(
  characterId: string
): Promise<HydratedCar[]> {
  if (!characterId) return [];

  const carsCol = collection(db, "Characters", characterId, "cars");
  const snap = await getDocs(carsCol);

  return snap.docs.map((d) => hydrateCarDoc(d.id, d.data() as CarDoc));
}
