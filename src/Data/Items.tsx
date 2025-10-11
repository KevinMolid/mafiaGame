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

const Hats = [
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

const Jackets = [
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

const Weapons = [
  {
    id: "iw0001",
    name: "Enkel kniv",
    slot: "weapon",
    tier: 1,
    value: 150,
    attack: 5,
    img: w1,
  },
  {
    id: "iw0002",
    name: "Springkniv",
    slot: "weapon",
    tier: 2,
    value: 250,
    attack: 6,
    img: w2,
  },
];

// Combine Hats and Jackets into a single Items array
const Items = [...Hats, ...Jackets, ...Weapons];

export default Items;

// Function to fetch an item by its ID
export const getItemById = (id: string) => {
  return Items.find((item) => item.id === id) || null;
};
