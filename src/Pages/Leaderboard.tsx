// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import CharacterList from "../components/CharacterList";
import FamilyList from "../components/FamilyList";
import Box from "../components/Box";

const Leaderboard = () => {
  return (
    <Main>
      <H1>Leaderboard</H1>
      <H2>Players</H2>
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-grow">
          <Box>
            <H3>Rank</H3>
            <CharacterList type="rank" sortBy="xp" />
          </Box>
        </div>

        <div className="flex-grow">
          <Box>
            <H3>Money</H3>
            <CharacterList type="rank" sortBy="money" />
          </Box>
        </div>
      </div>

      <H1>Families</H1>
      <Box>
        <H3>Dominance</H3>
        <FamilyList />
      </Box>
    </Main>
  );
};

export default Leaderboard;
