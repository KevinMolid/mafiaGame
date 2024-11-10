// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";

import { ranks } from "../Functions/RankFunctions";

const GameGuide = () => {
  return (
    <Main img="MafiaBg">
      <H1>Spillguiden</H1>
      <div className="flex flex-col gap-4">
        <p>
          <strong>Mafia Reign</strong> er et spennende flerspillerspill der du
          bygger ditt kriminelle imperium i skyggene av fem storbyer.
        </p>
        <p>
          Stig i gradene, bygg din mafiafamilie og få innflytelse i byer som New
          York og Tokyo. Men husk, det finnes alltid noen sterkere i skyggene.
          Hvor langt er du villig til å gå for å herske?
        </p>
        <H2>Kriminelle handlinger</H2>
        <p>
          Gjennom å utføre <strong>kriminelle handlinger</strong> vil du tjene
          erfaringspoeng (xp). Basert på dine erfaringspoeng vil du få tildelt
          en rank som forteller hvor langt du har kommet i spillet.
        </p>
        <p>
          Kriminelle handlinger som gir deg erfaringspoeng (xp) er Kriminalitet,
          Biltyveri, Ran spiller og Drep spiller.
        </p>

        <H2>Ranksystemet</H2>
        <p>De ulike rankene låser opp ulike funksjoner og utstyr i spillet.</p>
        <H3>Rankene</H3>
        <ul>
          {ranks.map((rank, index) => (
            <li key={rank.name}>
              {index + 1}. {rank.name}
            </li>
          ))}
        </ul>
      </div>
    </Main>
  );
};

export default GameGuide;
