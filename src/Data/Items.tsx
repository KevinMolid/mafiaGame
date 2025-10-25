// Hats
import h1 from "/images/items/h1.jpg";
import h2 from "/images/items/h2.jpg";
import h3 from "/images/items/h3.jpg";
import h4 from "/images/items/h4.jpg";
import h5 from "/images/items/h5.jpg";
import h6 from "/images/items/h6.jpg";
import h7 from "/images/items/h7.jpg";
import h8 from "/images/items/h8.jpg";
import h9 from "/images/items/h9.jpg";

// Jackets
import j2 from "/images/items/j2.jpg";
import j6 from "/images/items/j6.jpg";
import j8 from "/images/items/j8.jpg";

// Weapons
import w1 from "/images/items/Knife1.png";
import w2 from "/images/items/Knife2.jpg";
import w3 from "/images/items/w3.jpg";
import w4 from "/images/items/ColtM1911.jpg";
import w5 from "/images/items/Beretta92FS.jpg";
import w6 from "/images/items/DesertEagle50AE.jpg";
import w7 from "/images/items/Remington870.jpg";
import w8 from "/images/items/Uzi.jpg";

// Bullets
import b1 from "/images/items/b1.jpg";
import b2 from "/images/items/b2.jpg";

// Narcotics
import n1 from "/images/items/n1.png";
import n2 from "/images/items/n2.png";

// ---------- Types ----------
export type Slot = "hat" | "jacket" | "weapon" | "bullet" | "narcotic";

interface BaseItem {
  id: string;
  name: string;
  tier: number;
  value: number;
  img: string;
  stackable?: boolean;
}

export interface HatItem extends BaseItem {
  slot: "hat";
  hp: number;
}

export interface JacketItem extends BaseItem {
  slot: "jacket";
  hp: number;
}

export interface WeaponItem extends BaseItem {
  slot: "weapon";
  attack: number;
  usingBullets: boolean;
  capacity?: number;
}

export interface BulletItem extends BaseItem {
  type: "bullet";
  attack: number;
  stackable: true;
}

export interface NarcoticItem extends BaseItem {
  stackable: true;
  // add effect fields later if needed, e.g. duration, boost, etc.
}

export type Item =
  | HatItem
  | JacketItem
  | WeaponItem
  | BulletItem
  | NarcoticItem;

// ---------- Category Arrays ----------
export const Hats: HatItem[] = [
  {
    id: "ih0001",
    name: "Bailey of Hollywood Fedora",
    slot: "hat",
    tier: 1,
    value: 150,
    hp: 5,
    img: h1,
  },
  {
    id: "ih0002",
    name: "Biltmore Fedora",
    slot: "hat",
    tier: 1,
    value: 250,
    hp: 10,
    img: h2,
  },
  {
    id: "ih0003",
    name: "Stetson Fedora",
    slot: "hat",
    tier: 2,
    value: 300,
    hp: 15,
    img: h3,
  },
  {
    id: "ih0004",
    name: "Resistol Fedora",
    slot: "hat",
    tier: 2,
    value: 500,
    hp: 25,
    img: h4,
  },
  {
    id: "ih0005",
    name: "Christys Fedora",
    slot: "hat",
    tier: 3,
    value: 600,
    hp: 35,
    img: h5,
  },
  {
    id: "ih0006",
    name: "Lock & Co Fedora",
    slot: "hat",
    tier: 3,
    value: 1000,
    hp: 50,
    img: h6,
  },
  {
    id: "ih0007",
    name: "Rosa Fedora",
    slot: "hat",
    tier: 4,
    value: 1000,
    hp: 50,
    img: h7,
  },
  {
    id: "ih0008",
    name: "Pimp Fedora",
    slot: "hat",
    tier: 4,
    value: 1000,
    hp: 50,
    img: h8,
  },
  {
    id: "ih0009",
    name: "Bling Fedora",
    slot: "hat",
    tier: 5,
    value: 1000,
    hp: 50,
    img: h9,
  },
];

export const Jackets: JacketItem[] = [
  {
    id: "ij0001",
    name: "Skrukket jakke",
    slot: "jacket",
    tier: 1,
    value: 250,
    hp: 10,
    img: j2,
  },
  {
    id: "ij0002",
    name: "Tykk frakk",
    slot: "jacket",
    tier: 3,
    value: 1000,
    hp: 50,
    img: j6,
  },
  {
    id: "ij0003",
    name: "Pimp Jakke",
    slot: "jacket",
    tier: 4,
    value: 1000,
    hp: 50,
    img: j8,
  },
];

export const Weapons: WeaponItem[] = [
  {
    id: "iw0001",
    name: "Enkel kniv",
    slot: "weapon",
    tier: 1,
    value: 150,
    attack: 5,
    img: w1,
    usingBullets: false,
  },
  {
    id: "iw0002",
    name: "Springkniv",
    slot: "weapon",
    tier: 2,
    value: 250,
    attack: 6,
    img: w2,
    usingBullets: false,
  },
  {
    id: "iw0003",
    name: "Glock 17",
    slot: "weapon",
    tier: 3,
    value: 1500,
    attack: 8,
    img: w3,
    usingBullets: true,
    capacity: 17,
  },
  {
    id: "iw0004",
    name: "Colt M1911",
    slot: "weapon",
    tier: 3,
    value: 1500,
    attack: 14,
    img: w4,
    usingBullets: true,
    capacity: 7,
  },
  {
    id: "iw0005",
    name: "Beretta 92FS",
    slot: "weapon",
    tier: 3,
    value: 1500,
    attack: 12,
    img: w5,
    usingBullets: true,
    capacity: 15,
  },
  {
    id: "iw0006",
    name: "Desert Eagle .50 AE",
    slot: "weapon",
    tier: 3,
    value: 1500,
    attack: 22,
    img: w6,
    usingBullets: true,
    capacity: 7,
  },
  {
    id: "iw0007",
    name: "Remington 870",
    slot: "weapon",
    tier: 4,
    value: 1500,
    attack: 36,
    img: w7,
    usingBullets: true,
    capacity: 5,
  },
  {
    id: "iw0008",
    name: "Uzi",
    slot: "weapon",
    tier: 4,
    value: 1500,
    attack: 10,
    img: w8,
    usingBullets: true,
    capacity: 25,
  },
];

export const Bullets: BulletItem[] = [
  {
    id: "ib0001",
    name: "Enkel kule",
    tier: 1,
    value: 15,
    attack: 1,
    img: b1,
    stackable: true,
    type: "bullet",
  },
  {
    id: "ib0002",
    name: "Kvalitetskule",
    tier: 2,
    value: 25,
    attack: 2,
    img: b2,
    stackable: true,
    type: "bullet",
  },
];

export const Narcotics: NarcoticItem[] = [
  {
    id: "in0001",
    name: "Kokain",
    tier: 2,
    value: 150,
    img: n1,
    stackable: true,
  },
  {
    id: "in0002",
    name: "Ecstasy",
    tier: 2,
    value: 150,
    img: n2,
    stackable: true,
  },
];

// ---------- Combined + Helpers ----------
export const Items: Item[] = [
  ...Hats,
  ...Jackets,
  ...Weapons,
  ...Bullets,
  ...Narcotics,
];

export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(
  Items.map((i) => [i.id, i])
);

export function getItemById(id: string): Item | null {
  return ITEMS_BY_ID[id] ?? null;
}
