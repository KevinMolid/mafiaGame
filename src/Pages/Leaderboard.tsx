// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";

const Leaderboard = () => {
  return (
    <Main>
      <H1>Leaderboard</H1>
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 my-4">
        <H2>Rank</H2>
        <CharacterList
          include="all"
          action="link"
          sortBy="xp"
          showRank={true}
        />
      </div>

      <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 my-4">
        <H2>Money Rank</H2>
        <CharacterList
          include="moneyRank"
          action="link"
          sortBy="money"
          showRank={true}
        />
      </div>
    </Main>
  );
};

export default Leaderboard;
