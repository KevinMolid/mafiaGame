import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Button from "../components/Button";
import Box from "../components/Box";

import Super from "/images/Super.jpg";
import Aklasse from "/images/A-class.jpg";
import Bklasse from "/images/B-class.jpg";
import Cklasse from "/images/C-class.jpg";
import Dklasse from "/images/D-class.jpg";

const StreetRacing = () => {
  return (
    <Main>
      <H1>Street Racing</H1>
      <p className="mb-4">
        Her kan du konkurrere i gateløp med biler du eier mot andre spillere.
      </p>
      <div className="flex gap-4 flex-wrap">
        {/* D-klasse */}
        <div>
          <img
            src={Dklasse}
            className="border border-b-2 border-neutral-600 border-b-neutral-400"
          />
          <Box>
            <div className="flex justify-between items-end">
              <div>
                <H2>D-klasse</H2>
                <p>Velg bil</p>
              </div>
              <Button>Delta</Button>
            </div>
          </Box>
        </div>

        {/* C-klasse */}
        <div>
          <img
            src={Cklasse}
            className="border border-b-2 border-neutral-600 border-b-green-400"
          />
          <Box>
            <div className="flex justify-between items-end">
              <div>
                <H2>C-klasse</H2>
                <p>Velg bil</p>
              </div>
              <Button>Delta</Button>
            </div>
          </Box>
        </div>

        {/* B-klasse */}
        <div>
          <img
            src={Bklasse}
            className="border border-b-2 border-neutral-600 border-b-blue-400"
          />
          <Box>
            <div className="flex justify-between items-end">
              <div>
                <H2>B-klasse</H2>
                <p>Velg bil</p>
              </div>
              <Button>Delta</Button>
            </div>
          </Box>
        </div>

        {/* A-klasse */}
        <div>
          <img
            src={Aklasse}
            className="border border-b-2 border-neutral-600 border-b-purple-400"
          />
          <Box>
            <div className="flex justify-between items-end">
              <div>
                <H2>A-klasse</H2>
                <p>Velg bil</p>
              </div>
              <Button>Delta</Button>
            </div>
          </Box>
        </div>

        {/* S-klasse */}
        <div>
          <img
            src={Super}
            className="border border-b-2 border-neutral-600 border-b-yellow-400"
          />
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
      </div>
    </Main>
  );
};

export default StreetRacing;
