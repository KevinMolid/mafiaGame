const ParkingTypes = [
  { name: "No parking", slots: 0, security: 0, price: 0 },
  { name: "Street Parking", slots: 1, security: 0, price: 1000 },
  { name: "Small Driveway", slots: 2, security: 5, price: 5000 },
  { name: "Private Garage", slots: 4, security: 10, price: 25000 },
  { name: "Community Lot", slots: 8, security: 15, price: 100000 },
  { name: "Underground Parking", slots: 15, security: 20, price: 500000 },
  { name: "Secured Parking Garage", slots: 25, security: 30, price: 2500000 },
  { name: "Valet Parking Service", slots: 40, security: 40, price: 10000000 },
  {
    name: "Multi-Level Parking Structure",
    slots: 60,
    security: 50,
    price: 40000000,
  },
  { name: "Private Lot", slots: 80, security: 70, price: 150000000 },
  { name: "Luxury Car Compound", slots: 100, security: 90, price: 1000000000 },
];

export default ParkingTypes;
