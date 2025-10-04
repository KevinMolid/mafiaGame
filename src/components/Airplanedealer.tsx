import H2 from "./Typography/H2";
import { useState, useMemo, useEffect } from "react";
import Button from "./Button";
import InfoBox from "./InfoBox";
import { Link } from "react-router-dom";

import Airplanes from "../Data/Airplanes";

import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

const db = getFirestore();

const Airplanedealer = () => {
  const [selectedPlane, setSelectedPlane] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  // Local immediate reflection of the active plane after purchase
  const [activePlaneLocal, setActivePlaneLocal] = useState<string | null>(null);

  const { userCharacter } = useCharacter();
  const { userData } = useAuth();

  const activePlaneFromServer = (userCharacter as any)?.airplane?.name ?? null;
  const activePlane = useMemo(
    () => activePlaneLocal ?? activePlaneFromServer,
    [activePlaneLocal, activePlaneFromServer]
  );

  useEffect(() => {
    if (activePlaneFromServer && !activePlaneLocal) {
      setSelectedPlane(activePlaneFromServer);
    }
  }, [activePlaneFromServer, activePlaneLocal]);

  async function handleBuy(plane: (typeof Airplanes)[number]) {
    if (!userCharacter?.id || !userData) {
      setMessageType("warning");
      setMessage("Du må være logget inn for å kjøpe privatfly.");
      return;
    }

    // Money check
    const money = (userCharacter as any)?.stats?.money ?? 0;
    if (money < plane.value) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å kjøpe dette privatflyet.");
      return;
    }

    setIsBuying(true);
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);

      // Overwrite the single active airplane AND subtract money
      await updateDoc(characterRef, {
        airplane: {
          name: plane.name,
          value: plane.value,
          passengerSlots: plane.passengerSlots,
          maxCargoLoad: plane.maxCargoLoad,
          flightCost: plane.flightCost,
          tier: plane.tier,
          img: plane.img ?? null,
          acquiredAt: Date.now(),
        },
        "stats.money": increment(-plane.value),
      });

      // Instant UI update without waiting for snapshot
      setActivePlaneLocal(plane.name);

      setMessageType("success");
      setMessage(
        <>
          Du kjøpte <strong>{plane.name}</strong> for{" "}
          <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{plane.value.toLocaleString("nb-NO")}</strong>. Dette er nå
          ditt aktive privatfly.
        </>
      );
      setSelectedPlane(null);
    } catch (err) {
      console.error(err);
      setMessageType("failure");
      setMessage("Noe gikk galt under kjøpet av privatfly. Prøv igjen.");
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <>
      <H2>
        <i className="fa-solid fa-plane-up"></i> Kjøp privatfly
      </H2>

      <p className="mb-4">
        Privatfly kan brukes fra{" "}
        <strong>
          <Link to="/flyplass">
            <i className={`fa-solid fa-plane`}></i> Flyplass
          </Link>{" "}
        </strong>
        for å reise eller transportere narkotika mellom byer.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* Same list/card layout style as Cardealer */}
      <ul className="flex flex-wrap gap-2 mb-4">
        {Airplanes.map((plane) => {
          const isActive = activePlane === plane.name;

          return (
            <li
              key={plane.name}
              className={`flex border justify-between relative ${
                selectedPlane === plane.name || isActive
                  ? "bg-neutral-900 border-neutral-600 cursor-pointer"
                  : "bg-neutral-800 border-neutral-800 cursor-pointer"
              }`}
              onClick={() => setSelectedPlane(plane.name)}
            >
              {/* Active badge */}
              {isActive && (
                <span className="absolute top-1 right-1 font-semibold uppercase px-2 py-0.5 rounded border-2 border-neutral-400 text-neutral-200 bg-neutral-800">
                  Aktiv
                </span>
              )}

              <div className="flex flex-col gap-4 w-52">
                {plane.img && (
                  <img
                    src={plane.img}
                    className={
                      "h-fit w-52 border-2 " +
                      (plane.tier === 1
                        ? "border-neutral-400"
                        : plane.tier === 2
                        ? "border-green-400"
                        : plane.tier === 3
                        ? "border-blue-400"
                        : plane.tier === 4
                        ? "border-purple-400"
                        : plane.tier === 5
                        ? "border-yellow-400"
                        : "")
                    }
                  />
                )}

                <div className="flex flex-col justify-center w-full px-4 gap-2 pb-2">
                  <div>
                    <p>
                      <strong
                        className={
                          plane.tier === 1
                            ? "text-neutral-400"
                            : plane.tier === 2
                            ? "text-green-400"
                            : plane.tier === 3
                            ? "text-blue-400"
                            : plane.tier === 4
                            ? "text-purple-400"
                            : plane.tier === 5
                            ? "text-yellow-400"
                            : ""
                        }
                      >
                        {plane.name}
                      </strong>
                    </p>

                    <div className="text-neutral-200 text-sm space-y-0.5">
                      <p>
                        Passasjerer:{" "}
                        <span className="text-white">
                          {plane.passengerSlots}
                        </span>
                      </p>
                      <p>
                        Max lastevekt:{" "}
                        <span className="text-white">
                          {plane.maxCargoLoad.toLocaleString("nb-NO")} kg
                        </span>
                      </p>
                      <p>
                        Brukskostnad:{" "}
                        <i className="fa-solid fa-dollar-sign"></i>{" "}
                        <span className="text-white">
                          {plane.flightCost.toLocaleString("nb-NO")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    disabled={
                      isBuying ||
                      isActive || // prevent re-buying the active plane
                      !selectedPlane ||
                      selectedPlane !== plane.name
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(plane);
                    }}
                  >
                    {isActive ? (
                      "Aktivt fly"
                    ) : (
                      <>
                        Kjøp{" "}
                        <strong className="text-yellow-400">
                          <i className="fa-solid fa-dollar-sign"></i>{" "}
                          {plane.value.toLocaleString("nb-NO")}
                        </strong>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default Airplanedealer;
