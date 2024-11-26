import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import Box from "../components/Box";
import Button from "../components/Button";

import Tab from "../components/Tab";

import Cars from "../Data/Cars";

import { useEffect, useState } from "react";

const StreetRacing = () => {
  const defaultLiga = { name: "Klasse D", tier: 1 };
  const ligas = [
    { name: "Klasse D", tier: 1 },
    { name: "Klasse C", tier: 2 },
    { name: "Klasse B", tier: 3 },
    { name: "Klasse A", tier: 4 },
    { name: "Klasse S", tier: 5 },
    { name: "Klasse E", tier: undefined },
  ];

  // State
  const [selectedLiga, setSelectedLiga] = useState<{
    name: string;
    tier: number | undefined;
  }>(() => {
    const storedLiga = localStorage.getItem("selectedLiga");
    return storedLiga ? JSON.parse(storedLiga) : defaultLiga; // Handle null case
  });
  const [showAcceptedCars, setShowAcceptedCars] = useState<boolean>(false);

  // Save selectedLiga to localStorage
  useEffect(() => {
    localStorage.setItem("selectedLiga", JSON.stringify(selectedLiga));
  }, [selectedLiga]);

  return (
    <Main>
      <H1>Street Racing</H1>
      <p className="mb-4">
        Her kan du konkurrere i gateløp med biler du eier mot andre spillere.
      </p>
      <ul className="flex flex-wrap">
        {ligas.map((liga, index) => (
          <Tab
            key={"liga" + index}
            active={selectedLiga ? selectedLiga.name === liga.name : false}
            onClick={() => setSelectedLiga(liga)}
          >
            {liga.name}
          </Tab>
        ))}
      </ul>

      {selectedLiga && (
        <div className="mt-4">
          <Box>
            <H2>{selectedLiga.name}</H2>
            <div className="mb-4">
              <p
                className="font-medium text-neutral-200 cursor-pointer select-none"
                onClick={() => setShowAcceptedCars(!showAcceptedCars)}
              >
                Se godkjente biler{" "}
                {showAcceptedCars ? (
                  <i className="fa-solid fa-caret-up"></i>
                ) : (
                  <i className="fa-solid fa-caret-down"></i>
                )}
              </p>
              {showAcceptedCars && (
                <ul className="flex flex-wrap gap-x-1 gap-y-1 mt-1">
                  {Cars.map((car) => {
                    // Ligas without tier sorting
                    if (!selectedLiga.tier && car.isElectric == true) {
                      return (
                        <li
                          key={car.name}
                          className="bg-neutral-800 px-4 rounded-full"
                        >
                          <small
                            className={
                              "font-bold " +
                              (car.tier == 1
                                ? "text-neutral-400"
                                : car.tier == 2
                                ? "text-green-400"
                                : car.tier == 3
                                ? "text-blue-400"
                                : car.tier == 4
                                ? "text-purple-400"
                                : car.tier == 5
                                ? "text-yellow-400"
                                : "")
                            }
                          >
                            {car.name}
                          </small>
                        </li>
                      );
                      // Tier sorting
                    } else if (
                      car.tier === selectedLiga.tier &&
                      car.isElectric == false
                    ) {
                      return (
                        <li
                          key={car.name}
                          className="bg-neutral-800 px-4 rounded-full"
                        >
                          <small
                            className={
                              "font-bold " +
                              (car.tier == 1
                                ? "text-neutral-400"
                                : car.tier == 2
                                ? "text-green-400"
                                : car.tier == 3
                                ? "text-blue-400"
                                : car.tier == 4
                                ? "text-purple-400"
                                : car.tier == 5
                                ? "text-yellow-400"
                                : "")
                            }
                          >
                            {car.name}
                          </small>
                        </li>
                      );
                    }
                  })}
                </ul>
              )}
            </div>
            <div className="mb-4">
              <H3>Velg bil</H3>
              <p>Kommer snart. Under utvikling.</p>
            </div>
            <Button>Delta</Button>
          </Box>
        </div>
      )}
    </Main>
  );
};

export default StreetRacing;
