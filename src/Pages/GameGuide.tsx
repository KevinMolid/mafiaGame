// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";

import { moneyRanks } from "../Functions/RankFunctions";
import { rankDefinitions, getRankPerksText } from "../config/GameConfig";

const GameGuide = () => {
  return (
    <Main img="MafiaBg">
      <H1>Spillguiden</H1>
      <div className="flex flex-col gap-4">
        <p>
          <strong>Den siste Don</strong> er et flerspillerspill der du bygger
          ditt kriminelle imperium i skyggene av fem storbyer.
        </p>
        <p>
          Stig i gradene, bygg din familie og få innflytelse. Men husk, det
          finnes alltid noen sterkere i skyggene. Hvor langt er du villig til å
          gå for å herske?
        </p>
        <H2>Kriminelle handlinger</H2>
        <H3>Kriminalitet</H3>
        <p>
          Utfør enkle kriminelle handlinger som gir deg erfaring (xp) og penger.
          De ulike alternativene har ulik sjanse for å lykkes, og gir ulik
          mengde erfaring og penger.
        </p>
        <p>
          <span className="text-neutral-200">Lommetyveri</span>: 90% sjanse, 4xp
          <br />
          <span className="text-neutral-200">Herverk</span>:: 85% sjanse, 5xp{" "}
          <br />
          <span className="text-neutral-200">Stjel verdisaker</span>:: 80%
          sjanse, 6xp <br />
          <span className="text-neutral-200">Ran butikk</span>:: 75% sjanse, 7xp
        </p>
        <H3>Biltyveri</H3>
        <H3>Ran spiller</H3>
        <p>
          Du kan rane en spiller dersom dere begge befinner dere i samme by. Ved
          vellykket ran vil du stjele 10-50% av spillerens utestående penger.
        </p>
        <p>
          <strong className="text-neutral-200">
            Rane en tilfeldig spiller
          </strong>
          <br />
          Forsøk å rane en tilfeldig spiller i samme by.
        </p>
        <p>
          <strong className="text-neutral-200">Rane en bestemt spiller</strong>
          <br />
          Skriv in brukernavnet på spilleren du vil forsøke å rane. Dersom
          spilleren er i samme by er det 50% sjanse for at du finner spilleren.
          Deretter er det 75% sjanse for vellykket ran.
        </p>
        <H3>Drep spiller</H3>
        <H2>Ranksystemet</H2>
        <p>De ulike rankene låser opp ulike funksjoner og utstyr i spillet.</p>
        {/* Ranks */}
        <H3>Rankene</H3>
        <ul>
          <li
            key="rank-headings"
            className="grid grid-cols-[15px_100px_auto] gap-4 font-bold text-neutral-200 border-b border-neutral-600"
          >
            <p></p>
            <p>Rank</p>
            <p>Låser opp</p>
          </li>
          {rankDefinitions.map((rank) => (
            <li
              key={rank.id}
              className="grid grid-cols-[15px_100px_auto] gap-4"
            >
              <p>{rank.id}. </p>
              <p className="text-neutral-200">{rank.name}</p>
              <p>{getRankPerksText(rank.id)}</p>
            </li>
          ))}
        </ul>

        <H3>Pengerankene</H3>
        <ul>
          <li
            key="rank-headings"
            className="grid grid-cols-[15px_120px_auto] gap-4 font-bold text-neutral-200 border-b border-neutral-600"
          >
            <p></p>
            <p>Rank</p>
            <p>Penger</p>
          </li>
          {moneyRanks.map((rank, index) => (
            <li
              key={rank.name}
              className="grid grid-cols-[15px_120px_auto] gap-4"
            >
              <p>{index + 1}. </p>
              <p className="text-neutral-200">{rank.name}</p>
              <p>${rank.minAmount.toLocaleString()} +</p>
            </li>
          ))}
        </ul>
      </div>
    </Main>
  );
};

export default GameGuide;
