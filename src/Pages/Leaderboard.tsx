import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";

const Leaderboard = () => {
  return (
    <section>
      <H1>Leaderboard</H1>
      <div className="bg-neutral-800 border rounded-lg px-4 py-2 my-4">
        <H2>Rank</H2>
        <CharacterList include="all" action="link" />
      </div>

      <div className="bg-neutral-800 border rounded-lg px-4 py-2 my-4">
        <H2>Money Rank</H2>
        <CharacterList include="moneyRank" action="link" />
      </div>
    </section>
  );
};

export default Leaderboard;
