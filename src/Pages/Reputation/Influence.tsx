// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Box from "../../components/Box";

const Influence = () => {
  return (
    <Main>
      <H1>Innflytelse</H1>
      <p className="mb-4">
        Denne siden har ingen funksjon intill videre. Innflytelse vil utvikles
        senere, men er ikke en prioritering for øyeblikket.
      </p>

      <div className="flex gap-4 flex-col">
        <Box>
          <H2>Rykte</H2>
          <div className="grid lg:grid-cols-2 gap-6">
            <article>
              <p>
                <i className="fa-solid fa-shield"></i> Politi
              </p>
              <div className="h-3 bg-neutral-800">
                <div className="h-3 bg-blue-400 w-2/4"></div>
              </div>
            </article>
            <article>
              <p>
                <i className="fa-solid fa-landmark"></i> Styresmakter
              </p>
              <div className="h-3 bg-neutral-800">
                <div className="h-3 bg-red-400 w-1/4"></div>
              </div>
            </article>
            <article>
              <p>
                <i className="fa-solid fa-gun"></i> Gjenger
              </p>
              <div className="h-3 bg-neutral-800">
                <div className="h-3 bg-yellow-400 w-3/4"></div>
              </div>
            </article>
            <article>
              <p>
                <i className="fa-solid fa-leaf"></i> Organisasjoner
              </p>
              <div className="h-3 bg-neutral-800">
                <div className="h-3 bg-green-400 w-1/12"></div>
              </div>
            </article>
          </div>
        </Box>

        {/* Beskrivelse*/}
        <div className="grid gap-4 lg:grid-cols-2">
          <Box>
            <H2>
              <i className="fa-solid fa-shield"></i> Politi
            </H2>
            <p>Gir økt beskyttelse og lavere sjanse for å havne i fengsel.</p>
          </Box>
          <Box>
            <H2>
              <i className="fa-solid fa-landmark"></i> Styresmakter
            </H2>
            <p>
              Gir økt innflytelse og makt til å ta avgjørelser som påvirker
              spillet.
            </p>
          </Box>
          <Box>
            <H2>
              <i className="fa-solid fa-gun"></i> Gjenger
            </H2>
            <p>Gir økt angrepsstyrke ved forsøk på å drepe spillere.</p>
          </Box>
          <Box>
            <H2>
              <i className="fa-solid fa-leaf"></i> Organisasjoner
            </H2>
            <p>
              Gir større avkastning på bedrifter og større kapasitet for
              hvitevasking av penger.
            </p>
          </Box>
        </div>
      </div>
    </Main>
  );
};

export default Influence;
