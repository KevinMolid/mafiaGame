import CessnaCitationMustang from "/images/planes/Cessna Citation Mustang.jpg";
import BeechcraftKingAir350 from "/images/planes/Beechcraft King Air 350.jpg";

const Airplanes = [
  // Tier 1
  {
    name: "Cessna Citation Mustang",
    value: 2500000,
    img: CessnaCitationMustang,
    tier: 4,
    flightCost: 1000, // per 500 km
    passengerSlots: 4,
    maxCargoLoad: 320,
  },
  // Tier 2
  {
    name: "Beechcraft King Air 350",
    value: 7000000,
    img: BeechcraftKingAir350,
    tier: 5,
    flightCost: 2500, // per 500 km
    passengerSlots: 8,
    maxCargoLoad: 1000,
  },
];

export default Airplanes;
