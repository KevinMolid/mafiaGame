// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Item from "../../components/Typography/Item";
import ArrowTrail from "../ArrowTrail";
import { Link } from "react-router-dom";

import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";

import { useCharacter } from "../../CharacterContext";

import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useCooldown } from "../../CooldownContext";

// Define location coordinates as percentages
const locations = [
  { name: "Mexico City", coordinates: { top: "53%", left: "20%" } },
  { name: "Rio de Janeiro", coordinates: { top: "75%", left: "34%" } },
  { name: "Tokyo", coordinates: { top: "45%", left: "86%" } },
  { name: "Moskva", coordinates: { top: "33%", left: "57%" } },
  { name: "New York", coordinates: { top: "40%", left: "27%" } },
];

// convert percentages to number ex: "53%" -> 53
const pct = (s: string) => parseFloat(s.replace("%", "")) || 0;

const getPoint = (name: string | null | undefined) => {
  if (!name) return null;
  const loc = locations.find((l) => l.name === name);
  if (!loc) return null;
  return {
    x: pct(loc.coordinates.left), // left -> x
    y: pct(loc.coordinates.top), // top  -> y
  };
};

type Airplane = {
  acquiredAt?: number; // ms since epoch
  flightCost?: number;
  img?: string;
  maxCargoLoad?: number;
  name?: string;
  passengerSlots?: number;
  tier?: number;
  value?: number;
};

const Travel = () => {
  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();
  const [targetLocation, setTargetLocation] = useState("");
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "failure" | "important" | "warning"
  >("info");
  const db = getFirestore();

  // Measure the map container to compute aspect ratio (height/width)
  const mapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [mapScale, setMapScale] = useState(1);

  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 10 && h > 10) {
        setMapScale(h / w);
      }
    };

    // Observe size changes reliably
    const ro = new ResizeObserver(update);
    ro.observe(el);

    // Also run once right now
    update();

    return () => ro.disconnect();
  }, []);

  // Render nothing if character is null
  if (!userCharacter) {
    return null;
  }

  const plane: Airplane | undefined = userCharacter.airplane;

  // Toggle: use private plane or not
  const [usePrivatePlane, setUsePrivatePlane] = useState<boolean>(!!plane);

  // If the plane disappears (or appears), sync the toggle sensibly
  useEffect(() => {
    if (!plane) setUsePrivatePlane(false);
  }, [plane]);

  // Price depends on toggle & plane availability
  const priceToTravel = useMemo(() => {
    if (usePrivatePlane && plane?.flightCost && plane.flightCost > 0) {
      return plane.flightCost;
    }
    return 1000; // default/commercial price
  }, [usePrivatePlane, plane?.flightCost]);

  const handleTravel = async () => {
    if (!userCharacter) {
      console.error("Karakter ikke funnet");
      return;
    }

    if (!targetLocation || targetLocation === userCharacter.location) {
      setMessageType("info");
      setMessage("Velg en annen destinasjon for å reise.");
      return;
    }

    // Check if the character has enough money to travel
    if (userCharacter.stats.money < priceToTravel) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å reise!");
      return;
    }

    try {
      const charDocRef = doc(db, "Characters", userCharacter.id);
      // Update location and deduct cost (single update)
      await updateDoc(charDocRef, {
        location: targetLocation,
        "stats.money": userCharacter.stats.money - priceToTravel,
        lastActive: serverTimestamp(),
      });

      setMessageType("success");
      setMessage(
        <p>
          Du reiste til <strong>{targetLocation}</strong>{" "}
          {usePrivatePlane ? "med privatfly" : "med rutefly"} for{" "}
          <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{priceToTravel.toLocaleString("nb-NO")}</strong>.
        </p>
      );
    } catch (error) {
      console.error("Feil ved oppdatering av lokasjon:", error);
      setMessageType("failure");
      setMessage("Klarte ikke å reise. Prøv igjen.");
    }
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  // Compute start and end points for arrows
  const start = getPoint(userCharacter.location);
  const end = getPoint(targetLocation);
  const shouldShowArrow =
    !!start &&
    !!end &&
    targetLocation &&
    targetLocation !== userCharacter.location;

  return (
    <Main img="">
      <H1>Flyplass</H1>
      <p className="mb-2">Her kan du reise mellom byer.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      {!targetLocation && (
        <p>
          Du befinner deg for øyeblikket i{" "}
          <strong className="text-white">{userCharacter.location}</strong>.
        </p>
      )}
      {targetLocation && targetLocation !== userCharacter.location && (
        <p>
          Reis fra{" "}
          <strong className="text-white">{userCharacter.location}</strong> til{" "}
          <strong className="text-white">{targetLocation}</strong>?
        </p>
      )}

      <div className="flex gap-x-8 flex-wrap">
        {/* Map */}
        <div className="relative my-2 max-w-[800px]" ref={mapRef}>
          <img
            ref={imgRef}
            src="WorldMap3.png"
            alt="World Map"
            className="w-full h-auto"
            onLoad={() => {
              // ensure we do a fresh measurement once the image has a real height
              const el = mapRef.current;
              if (el) {
                const w = el.clientWidth;
                const h = el.clientHeight;
                if (w > 10 && h > 10) setMapScale(h / w);
              }
            }}
          />

          {/* City dots */}
          {locations.map((location) => (
            <div
              key={location.name}
              style={{
                position: "absolute",
                top: location.coordinates.top,
                left: location.coordinates.left,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor:
                  userCharacter.location === location.name
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
                if (userCharacter.location !== location.name) {
                  setTargetLocation(location.name);
                }
              }}
            />
          ))}

          {/* Arrow overlay */}
          {shouldShowArrow && (
            <ArrowTrail
              start={start}
              end={end}
              scale={mapScale}
              speedPctPerSec={15}
            />
          )}
        </div>

        {/* Privatfly */}
        <div className="min-w-[300px] mb-6">
          <H2>Privatfly</H2>

          {!plane ? (
            <>
              <p className="mb-2">Du eier ingen privatfly.</p>
              <p>
                Du kan kjøpe privatfly på siden{" "}
                <strong className="text-neutral-200">
                  <Link to="/marked">Marked</Link>
                </strong>
                .
              </p>
              {/* Toggle (disabled) */}
              <div className="mt-3 flex items-center gap-2 opacity-60">
                <button
                  type="button"
                  disabled
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700"
                  aria-pressed="false"
                  aria-label="Bruk privatfly"
                  title="Du har ikke privatfly"
                >
                  <span className="inline-block h-5 w-5 transform rounded-full bg-neutral-500 translate-x-1 transition" />
                </button>
                <span className="text-sm text-neutral-400">
                  Bruk privatfly (ikke tilgjengelig)
                </span>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <div className="flex gap-3">
                {plane.img && (
                  <img
                    src={decodeURI(plane.img)}
                    alt={plane.name || "Privatfly"}
                    className="w-40 h-24 object-cover rounded"
                  />
                )}
                <div className="text-neutral-200">
                  <p className="font-semibold text-white">
                    <Item
                      name={plane.name || "Privatfly"}
                      tier={plane.tier}
                    ></Item>
                  </p>
                  <ul className="text-sm text-neutral-300 space-y-0.5 mt-1">
                    {typeof plane.passengerSlots === "number" && (
                      <li>
                        Seteplasser:{" "}
                        <strong className="text-neutral-200">
                          {plane.passengerSlots}
                        </strong>
                      </li>
                    )}
                    {typeof plane.maxCargoLoad === "number" && (
                      <li>
                        Maks last:{" "}
                        <strong className="text-neutral-200">
                          {plane.maxCargoLoad.toLocaleString("nb-NO")} kg
                        </strong>
                      </li>
                    )}
                    {typeof plane.flightCost === "number" && (
                      <li>
                        Flykostnad per tur:{" "}
                        <strong className="text-neutral-200">
                          <i className="fa-solid fa-dollar-sign" />{" "}
                          {plane.flightCost.toLocaleString("nb-NO")}
                        </strong>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Toggle: Bruk privatfly */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsePrivatePlane((v) => !v)}
                  className={
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
                    (usePrivatePlane ? "bg-green-600" : "bg-neutral-700")
                  }
                  aria-pressed={usePrivatePlane}
                  aria-label="Bruk privatfly"
                  title="Bytt mellom privatfly og rutefly"
                >
                  <span
                    className={
                      "inline-block h-5 w-5 transform rounded-full bg-white transition " +
                      (usePrivatePlane ? "translate-x-5" : "translate-x-1")
                    }
                  />
                </button>
                <span className="text-sm text-neutral-300">
                  Bruk privatfly{" "}
                  {usePrivatePlane ? (
                    <span className="text-green-400 font-medium">(på)</span>
                  ) : (
                    <span className="text-neutral-400">(av)</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {targetLocation && (
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start flex-wrap gap-x-4 gap-y-2">
          <div>
            <Button onClick={handleTravel}>
              Fly til {targetLocation} <i className="fa-solid fa-plane"></i>{" "}
              <span className="text-yellow-400">
                <i className="fa-solid fa-dollar-sign"></i>{" "}
                {priceToTravel.toLocaleString("nb-NO")}
              </span>
            </Button>
          </div>

          <span className="text-sm text-neutral-400">
            {usePrivatePlane && plane
              ? "Reiser med privatfly"
              : "Reiser med rutefly"}
          </span>
        </div>
      )}
    </Main>
  );
};

export default Travel;
