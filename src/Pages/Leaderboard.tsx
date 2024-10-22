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
      <H1>Toppliste</H1>
      <H2>Spillere</H2>
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-grow">
          <Box>
            <H3>Rank</H3>
            <CharacterList type="rank" sortBy="xp" />
          </Box>
        </div>

        <div className="flex-grow">
          <Box>
            <H3>Penger</H3>
            <CharacterList type="rank" sortBy="money" />
          </Box>
        </div>
      </div>

      <H1>Familier</H1>
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-grow">
          <Box>
            <H3>Makt</H3>
            <FamilyList />
          </Box>
        </div>

        <div className="flex-grow">
          <Box>
            <H3>Formue</H3>
            <FamilyList />
          </Box>
        </div>
      </div>
    </Main>
  );
};

export default Leaderboard;
