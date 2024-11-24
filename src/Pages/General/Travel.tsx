// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";

import { useState } from "react";

import { useCharacter } from "../../CharacterContext";

import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// Define your location coordinates as percentages
const locations = [
  { name: "Mexico City", coordinates: { top: "53%", left: "20%" } },
  { name: "Rio de Janeiro", coordinates: { top: "75%", left: "34%" } },
  { name: "Tokyo", coordinates: { top: "45%", left: "86%" } },
  { name: "Moskva", coordinates: { top: "33%", left: "57%" } },
  { name: "New York", coordinates: { top: "40%", left: "27%" } },
];

const Travel = () => {
  const { character } = useCharacter();
  const [targetLocation, setTargetLocation] = useState("");
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "failure" | "important" | "warning"
  >("info");
  const db = getFirestore();
  const priceToTravel = 1000;

  // Render nothing if character is null
  if (!character) {
    return null;
  }

  const handleTravel = async () => {
    if (!character) {
      console.error("Karakter ikke funnet");
      return;
    }

    // Check if the character has enough money to travel
    if (character.stats.money < priceToTravel) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å reise!");
      return;
    }

    try {
      const charDocRef = doc(db, "Characters", character.id);
      // Update the character's location and deduct the travel cost
      await updateDoc(charDocRef, {
        location: targetLocation,
        "stats.money": character.stats.money - priceToTravel,
        lastActive: serverTimestamp(),
      });
      await updateDoc(charDocRef, { location: targetLocation });

      setMessageType("success");
      setMessage(
        `Du reiste til ${targetLocation} for $${priceToTravel.toLocaleString()}`
      );
    } catch (error) {
      console.error("Feil ved oppdatering aav lokasjon:", error);
    }
  };

  if (character?.inJail) {
    return (
      <Main>
        <JailBox message={message} messageType={messageType} />
      </Main>
    );
  }

  return (
    <Main img="">
      <H1>Flyplass</H1>
      <p className="mb-2">
        Her kan du reise mellom byer. Det koster{" "}
        <span className="font-medium text-yellow-400">
          ${priceToTravel.toLocaleString()}
        </span>{" "}
        å fly.
      </p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      {!targetLocation && (
        <p>
          Du befinner deg for øyeblikket i{" "}
          <strong className="text-white">{character.location}</strong>.
        </p>
      )}
      {targetLocation && targetLocation !== character.location && (
        <p>
          Reis fra <strong className="text-white">{character.location}</strong>{" "}
          til <strong className="text-white">{targetLocation}</strong>?
        </p>
      )}
      <div className="relative my-4 max-w-[800px]">
        <img src="WorldMap3.png" alt="World Map" className="w-full h-auto" />
        {locations.map((location) => (
          <div
            key={location.name}
            style={{
              position: "absolute",
              top: location.coordinates.top,
              left: location.coordinates.left,
              width: "20px",
              height: "20px",
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
        <div className="flex items-center gap-4">
          <Button onClick={handleTravel}>
            Fly til {targetLocation} <i className="fa-solid fa-plane"></i>{" "}
            <span className="text-yellow-400">
              ${priceToTravel.toLocaleString()}
            </span>
          </Button>
        </div>
      )}
    </Main>
  );
};

export default Travel;
