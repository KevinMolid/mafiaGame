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
import j1 from "/images/items/j1.jpg";
import j2 from "/images/items/j2.jpg";
import j6 from "/images/items/j6.jpg";
import j8 from "/images/items/j8.jpg";
import j5 from "/images/items/j5.jpg";

// Feet
import f1 from "/images/items/f1.jpg";
import f2 from "/images/items/f2.jpg";
import f3 from "/images/items/f3.jpg";
import f4 from "/images/items/f4.jpg";
import f5 from "/images/items/f5.jpg";

// Face
import fa1 from "/images/items/fa1.jpg";
import fa2 from "/images/items/fa2.jpg";
import fa3 from "/images/items/fa3.jpg";
import fa4 from "/images/items/fa4.jpg";
import fa5 from "/images/items/fa5.jpg";

// Neck
import nk1 from "/images/items/nk1.jpg";
import nk2 from "/images/items/nk2.jpg";
import nk3 from "/images/items/nk3.jpg";
import nk4 from "/images/items/nk4.jpg";
import nk5 from "/images/items/nk5.jpg";

// Hands
import hd1 from "/images/items/hd1.jpg";
import hd2 from "/images/items/hd2.jpg";
import hd3 from "/images/items/hd3.jpg";
import hd4 from "/images/items/hd4.jpg";
import hd5 from "/images/items/hd5.jpg";

// Rings
import r1 from "/images/items/r1.jpg";
import r2 from "/images/items/r2.jpg";
import r3 from "/images/items/r3.jpg";
import r4 from "/images/items/r4.jpg";
import r5 from "/images/items/r5.jpg";
import r6 from "/images/items/r6.jpg";
import r7 from "/images/items/r7.jpg";
import r8 from "/images/items/r8.jpg";
import r9 from "/images/items/r9.jpg";
import r10 from "/images/items/r10.jpg";

// Weapons
import w1 from "/images/items/Knife1.png";
import w2 from "/images/items/Knife2.jpg";
import w3 from "/images/items/w3.jpg";
import w4 from "/images/items/ColtM1911.jpg";
import w5 from "/images/items/Beretta92FS.jpg";
import w6 from "/images/items/DesertEagle50AE.jpg";
import w7 from "/images/items/Remington870.jpg";
import w8 from "/images/items/Uzi.jpg";
import w9 from "/images/items/w9.jpg";
import w10 from "/images/items/w10.jpg";

// Bullets
import b1 from "/images/items/b1.jpg";
import b2 from "/images/items/b2.jpg";

// Narcotics
import n1 from "/images/items/n1.png";
import n2 from "/images/items/n2.png";

// Special
import megaphone from "/images/items/megaphone.jpg";

// ---------- Types ----------
export type Slot =
  | "hat"
  | "jacket"
  | "feet"
  | "weapon"
  | "face"
  | "neck"
  | "hands"
  | "ring"
  | "bullet"
  | "narcotic";

interface BaseItem {
  id: string;
  name: string;
  tier: number;
  value: number;
  img: string;
  stackable?: boolean;
  shopOnly?: boolean;
  consumable?: boolean;
}

export interface HatItem extends BaseItem {
  slot: "hat";
  hp: number;
}

export interface JacketItem extends BaseItem {
  slot: "jacket";
  hp: number;
}

export interface FeetItem extends BaseItem {
  slot: "feet";
  hp: number;
}

export interface FaceItem extends BaseItem {
  slot: "face";
  hp: number;
}

export interface NeckItem extends BaseItem {
  slot: "neck";
  hp: number;
}

export interface HandsItem extends BaseItem {
  slot: "hands";
  hp: number;
}

export interface RingItem extends BaseItem {
  slot: "ring";
  hp?: number;
  attack?: number;
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
  type: "narcotic";
  stackable: true;
  consumable: true;
  // add effect fields later if needed, e.g. duration, boost, etc.
}

export interface MegaphoneItem extends BaseItem {
  type: "megaphone";
  stackable: true;
  shopOnly: true;
  consumable: true;
}

export type Item =
  | HatItem
  | JacketItem
  | FeetItem
  | WeaponItem
  | FaceItem
  | NeckItem
  | HandsItem
  | RingItem
  | BulletItem
  | NarcoticItem
  | MegaphoneItem;

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
    name: "Hettegenser",
    slot: "jacket",
    tier: 1,
    value: 250,
    hp: 10,
    img: j1,
  },
  {
    id: "ij0002",
    name: "Slitt dressjakke",
    slot: "jacket",
    tier: 2,
    value: 250,
    hp: 25,
    img: j2,
  },
  {
    id: "ij0003",
    name: "Tykk frakk",
    slot: "jacket",
    tier: 3,
    value: 1000,
    hp: 50,
    img: j6,
  },
  {
    id: "ij0004",
    name: "Pimp Jakke",
    slot: "jacket",
    tier: 4,
    value: 2500,
    hp: 60,
    img: j8,
  },
  {
    id: "ij0005",
    name: "Mafiafrakk",
    slot: "jacket",
    tier: 5,
    value: 10000,
    hp: 90,
    img: j5,
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
  {
    id: "iw0009",
    name: "Skarpskytterrifle",
    slot: "weapon",
    tier: 5,
    value: 8000,
    attack: 55,
    img: w9,
    usingBullets: true,
    capacity: 10,
  },
  {
    id: "iw0010",
    name: "Rakettkaster",
    slot: "weapon",
    tier: 5,
    value: 12000,
    attack: 80,
    img: w10,
    usingBullets: true,
    capacity: 5,
  },
];

export const Feet: FeetItem[] = [
  {
    id: "if0001",
    name: "Slitte boots",
    slot: "feet",
    tier: 1,
    value: 200,
    hp: 5,
    img: f1,
  },
  {
    id: "if0002",
    name: "Arbeidssko",
    slot: "feet",
    tier: 2,
    value: 450,
    hp: 15,
    img: f2,
  },
  {
    id: "if0003",
    name: "Skinnstøvler",
    slot: "feet",
    tier: 3,
    value: 900,
    hp: 30,
    img: f3,
  },
  {
    id: "if0004",
    name: "Pimp Boots",
    slot: "feet",
    tier: 4,
    value: 1800,
    hp: 55,
    img: f4,
  },
  {
    id: "if0005",
    name: "Diamantbesatte boots",
    slot: "feet",
    tier: 5,
    value: 3500,
    hp: 90,
    img: f5,
  },
];

export const Face: FaceItem[] = [
  {
    id: "ifa001",
    name: "Bandana",
    slot: "face",
    tier: 1,
    value: 150,
    hp: 5,
    img: fa1,
  },
  {
    id: "ifa002",
    name: "Skimaske",
    slot: "face",
    tier: 2,
    value: 500,
    hp: 15,
    img: fa2,
  },
  {
    id: "ifa003",
    name: "Sorte solbriller",
    slot: "face",
    tier: 3,
    value: 1200,
    hp: 30,
    img: fa3,
  },
  {
    id: "ifa004",
    name: "Mafiabriller",
    slot: "face",
    tier: 4,
    value: 2000,
    hp: 50,
    img: fa4,
  },
  {
    id: "ifa005",
    name: "Gullbelagte solbriller",
    slot: "face",
    tier: 5,
    value: 4000,
    hp: 75,
    img: fa5,
  },
];

export const Neck: NeckItem[] = [
  {
    id: "in001",
    name: "Lærhalskjede",
    slot: "neck",
    tier: 1,
    value: 200,
    hp: 5,
    img: nk1,
  },
  {
    id: "in002",
    name: "Sølvkjede",
    slot: "neck",
    tier: 2,
    value: 500,
    hp: 15,
    img: nk2,
  },
  {
    id: "in003",
    name: "Gullkjede",
    slot: "neck",
    tier: 3,
    value: 1200,
    hp: 30,
    img: nk3,
  },
  {
    id: "in004",
    name: "Pimp-kjede",
    slot: "neck",
    tier: 4,
    value: 2500,
    hp: 55,
    img: nk4,
  },
  {
    id: "in005",
    name: "Diamantkjede",
    slot: "neck",
    tier: 5,
    value: 5000,
    hp: 100,
    img: nk5,
  },
];

export const Hands: HandsItem[] = [
  {
    id: "ihd001",
    name: "Tynne hansker",
    slot: "hands",
    tier: 1,
    value: 150,
    hp: 5,
    img: hd1,
  },
  {
    id: "ihd002",
    name: "Skinnhansker",
    slot: "hands",
    tier: 2,
    value: 350,
    hp: 15,
    img: hd2,
  },
  {
    id: "ihd003",
    name: "Knyttnevehansker",
    slot: "hands",
    tier: 3,
    value: 900,
    hp: 30,
    img: hd3,
  },
  {
    id: "ihd004",
    name: "Mafia-hansker",
    slot: "hands",
    tier: 4,
    value: 2000,
    hp: 55,
    img: hd4,
  },
  {
    id: "ihd005",
    name: "Gullforede hansker",
    slot: "hands",
    tier: 5,
    value: 4000,
    hp: 90,
    img: hd5,
  },
];

export const Rings: RingItem[] = [
  // Tier 1
  {
    id: "ir0001",
    name: "Enkel ring",
    slot: "ring",
    tier: 1,
    value: 200,
    hp: 5,
    img: r1,
  },
  {
    id: "ir0002",
    name: "Slitt signetring",
    slot: "ring",
    tier: 1,
    value: 220,
    attack: 1,
    img: r2,
  },

  // Tier 2
  {
    id: "ir0003",
    name: "Sølvring",
    slot: "ring",
    tier: 2,
    value: 400,
    hp: 10,
    img: r3,
  },
  {
    id: "ir0004",
    name: "Sølv signetring",
    slot: "ring",
    tier: 2,
    value: 500,
    attack: 2,
    img: r4,
  },

  // Tier 3
  {
    id: "ir0005",
    name: "Gullring",
    slot: "ring",
    tier: 3,
    value: 900,
    hp: 20,
    img: r5,
  },
  {
    id: "ir0006",
    name: "Gull signetring",
    slot: "ring",
    tier: 3,
    value: 1300,
    attack: 4,
    img: r6,
  },

  // Tier 4
  {
    id: "ir0007",
    name: "Mafiaring",
    slot: "ring",
    tier: 4,
    value: 1800,
    hp: 35,
    img: r7,
  },
  {
    id: "ir0008",
    name: "Bossens signetring",
    slot: "ring",
    tier: 4,
    value: 2400,
    attack: 6,
    img: r8,
  },

  // Tier 5
  {
    id: "ir0009",
    name: "Diamantbesatt ring",
    slot: "ring",
    tier: 5,
    value: 3500,
    hp: 50,
    img: r9,
  },
  {
    id: "ir0010",
    name: "Dons diamantring",
    slot: "ring",
    tier: 5,
    value: 5000,
    attack: 10,
    img: r10,
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
    type: "narcotic",
    consumable: true,
  },
  {
    id: "in0002",
    name: "Ecstasy",
    tier: 2,
    value: 150,
    img: n2,
    stackable: true,
    type: "narcotic",
    consumable: true,
  },
];

// Specials
export const Megaphones: MegaphoneItem[] = [
  {
    id: "sp0001",
    name: "Megafon",
    tier: 5,
    value: 0,
    img: megaphone,
    stackable: true,
    type: "megaphone",
    consumable: true,
    shopOnly: true,
  },
];

// ---------- Combined + Helpers ----------
export const Items: Item[] = [
  ...Hats,
  ...Jackets,
  ...Feet,
  ...Face,
  ...Neck,
  ...Hands,
  ...Rings,
  ...Weapons,
  ...Bullets,
  ...Narcotics,
  ...Megaphones,
];

export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(
  Items.map((i) => [i.id, i])
);

export function getItemById(id: string): Item | null {
  return ITEMS_BY_ID[id] ?? null;
}
