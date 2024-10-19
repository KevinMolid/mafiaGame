// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import CharacterList from "../components/CharacterList";

const Leaderboard = () => {
  return (
    <Main>
      <H1>Leaderboard</H1>
      <H2>Players</H2>
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 my-4">
        <H3>Rank</H3>
        <CharacterList type="rank" sortBy="xp" />
      </div>

      <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 my-4">
        <H3>Money</H3>
        <CharacterList type="rank" sortBy="money" />
      </div>

      <H1>Families</H1>
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 my-4">
        <H3>Dominance</H3>
      </div>
    </Main>
  );
};

export default Leaderboard;
