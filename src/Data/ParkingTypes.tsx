const ParkingTypes = [
  { name: "Ingen parkering", slots: 0, security: 0, price: 0 },
  { name: "Offentlig parkering", slots: 1, security: 0, price: 1000 },
  { name: "Liten oppkjørsel", slots: 2, security: 5, price: 5000 },
  { name: "Privat garasje", slots: 4, security: 10, price: 25000 },
  { name: "Liten parkeringsplass", slots: 8, security: 15, price: 100000 },
  { name: "Parkeringskjeller", slots: 15, security: 20, price: 500000 },
  { name: "Sikret parkeringskjeller", slots: 25, security: 30, price: 2500000 },
  { name: "Parkeringshus", slots: 40, security: 40, price: 10000000 },
  {
    name: "Sikret parkeringshus",
    slots: 60,
    security: 50,
    price: 40000000,
  },
  {
    name: "Parkeringskompleks",
    slots: 80,
    security: 70,
    price: 150000000,
  },
  {
    name: "Luksuriøst parkeringskompleks",
    slots: 100,
    security: 90,
    price: 1000000000,
  },
];

export default ParkingTypes;
