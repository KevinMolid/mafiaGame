import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";

import { useState } from "react";

import { useCharacter } from "../../CharacterContext";

// Define your location coordinates as percentages
const locations = [
  { name: "Mexico City", coordinates: { top: "51%", left: "22%" } },
  { name: "Rio de Janeiro", coordinates: { top: "73%", left: "35%" } },
  { name: "Tokyo", coordinates: { top: "44%", left: "81%" } },
  { name: "Moscow", coordinates: { top: "32%", left: "56%" } },
  { name: "New York", coordinates: { top: "39%", left: "28%" } },
];

const Travel = () => {
  const { character } = useCharacter();
  const [targetLocation, setTargetLocation] = useState("");
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  return (
    <section>
      <H1>Travel</H1>
      <p className="text-stone-400">
        Current location:{" "}
        <strong className="text-white">{character.location}</strong>{" "}
      </p>
      {targetLocation && (
        <p className="text-stone-400">
          Traveling from{" "}
          <strong className="text-white">{character.location}</strong> to{" "}
          <strong className="text-white">{targetLocation}</strong>
        </p>
      )}
      <div className="relative">
        <img
          src="WorldMap.png"
          alt="World Map"
          style={{ width: "100%", height: "auto" }}
        />
        {locations.map((location) => (
          <div
            key={location.name}
            style={{
              position: "absolute",
              top: location.coordinates.top,
              left: location.coordinates.left,
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              backgroundColor:
                character.location === location.name
                  ? "#40b3d2"
                  : targetLocation === location.name
                  ? "#7fff00"
                  : hoveredLocation === location.name
                  ? "#ffffff"
                  : "#cccccc",
              cursor: "pointer",
              zIndex: 1,
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={() => setHoveredLocation(location.name)}
            onMouseLeave={() => setHoveredLocation(null)}
            title={location.name}
            onClick={() => {
              if (character.location !== location.name) {
                setTargetLocation(location.name);
              }
            }}
          />
        ))}
        <Button onClick={() => console.log(`Traveling to ${targetLocation}`)}>
          Travel
        </Button>
      </div>
    </section>
  );
};

export default Travel;
