// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

import { useState } from "react";

import { useCharacter } from "../../CharacterContext";

import { getFirestore, doc, updateDoc } from "firebase/firestore";

// Define your location coordinates as percentages
const locations = [
  { name: "Mexico City", coordinates: { top: "53%", left: "20%" } },
  { name: "Rio de Janeiro", coordinates: { top: "75%", left: "34%" } },
  { name: "Tokyo", coordinates: { top: "45%", left: "86%" } },
  { name: "Moscow", coordinates: { top: "33%", left: "57%" } },
  { name: "New York", coordinates: { top: "40%", left: "27%" } },
];

const Travel = () => {
  const { character } = useCharacter();
  const [targetLocation, setTargetLocation] = useState("");
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const db = getFirestore();

  // Render nothing if character is null
  if (!character) {
    return null;
  }

  const handleTravel = async () => {
    if (!character) {
      console.error("Karakter ikke funnet");
      return;
    }

    try {
      const charDocRef = doc(db, "Characters", character.id);
      await updateDoc(charDocRef, { location: targetLocation });

      setMessage(`Du reiste til ${targetLocation}`);
    } catch (error) {
      console.error("Feil ved oppdatering aav lokasjon:", error);
    }
  };

  return (
    <Main img="TravelBg">
      <H1>Flyplass</H1>
      {message && <InfoBox type="success">{message}</InfoBox>}
      {!targetLocation && (
        <p className="text-stone-400">
          Du befinner deg i{" "}
          <strong className="text-white">{character.location}</strong>{" "}
        </p>
      )}
      {targetLocation && targetLocation !== character.location && (
        <p className="text-stone-400">
          Reis fra <strong className="text-white">{character.location}</strong>{" "}
          til <strong className="text-white">{targetLocation}</strong>
        </p>
      )}
      <div className="relative my-4">
        <img
          src="WorldMap3.png"
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
              transform: "translate(-50%, -50%)",
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
      </div>
      {targetLocation && (
        <Button onClick={handleTravel}>Dra til {targetLocation}</Button>
      )}
    </Main>
  );
};

export default Travel;
