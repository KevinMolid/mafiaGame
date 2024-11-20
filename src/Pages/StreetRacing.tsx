import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import Box from "../components/Box";
import Button from "../components/Button";

import { useState } from "react";

const StreetRacing = () => {
  const [selectedLiga, setSelectedLiga] = useState<string>("");
  const [showAcceptedCars, setShowAcceptedCars] = useState<boolean>(false);

  const ligas = [
    "Klasse D",
    "Klasse C",
    "Klasse B",
    "Klasse A",
    "Klasse S",
    "Klasse El",
  ];

  return (
    <Main>
      <H1>Street Racing</H1>
      <p className="mb-4">
        Her kan du konkurrere i gateløp med biler du eier mot andre spillere.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-4">
        {ligas.map((liga, index) => (
          <div
            key={index}
            className="flex-grow cursor-pointer"
            onClick={() => setSelectedLiga(liga)}
          >
            <Box>
              <H3>{liga}</H3>
            </Box>
          </div>
        ))}
      </div>
      {selectedLiga && (
        <div className="mt-4">
          <Box>
            <H2>{selectedLiga}</H2>
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
              {showAcceptedCars && <p>Kommer snart. Under utvikling.</p>}
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
