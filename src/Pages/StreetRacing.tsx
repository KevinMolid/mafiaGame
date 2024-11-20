import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Button from "../components/Button";
import Box from "../components/Box";

const StreetRacing = () => {
  return (
    <Main>
      <H1>Street Racing</H1>
      <p className="mb-4">
        Her kan du konkurrere i gateløp med biler du eier mot andre spillere.
      </p>
      <div className="flex gap-4 flex-wrap">
        {/* D-klasse */}

        <Box>
          <div className="flex justify-between items-end">
            <div>
              <H2>D-klasse</H2>
              <p>Velg bil</p>
            </div>
            <Button>Delta</Button>
          </div>
        </Box>

        {/* C-klasse */}

        <Box>
          <div className="flex justify-between items-end">
            <div>
              <H2>C-klasse</H2>
              <p>Velg bil</p>
            </div>
            <Button>Delta</Button>
          </div>
        </Box>

        {/* B-klasse */}

        <Box>
          <div className="flex justify-between items-end">
            <div>
              <H2>B-klasse</H2>
              <p>Velg bil</p>
            </div>
            <Button>Delta</Button>
          </div>
        </Box>

        {/* A-klasse */}

        <Box>
          <div className="flex justify-between items-end">
            <div>
              <H2>A-klasse</H2>
              <p>Velg bil</p>
            </div>
            <Button>Delta</Button>
          </div>
        </Box>

        {/* S-klasse */}

        <Box>
          <div className="flex justify-between items-end">
            <div>
              <H2>S-klasse</H2>
              <p>Velg bil</p>
            </div>
            <Button>Delta</Button>
          </div>
        </Box>
      </div>
    </Main>
  );
};

export default StreetRacing;
