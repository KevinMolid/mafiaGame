// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";
import FamilyList from "../components/FamilyList";
import Box from "../components/Box";
import Tab from "../components/Tab";
import { useState } from "react";

const Leaderboard = () => {
  const [activePlayerPanel, setActivePlayerPanel] = useState<string>("rank");
  const [activeFamilyPanel, setActiveFamilyPanel] = useState<string>("power");

  return (
    <Main>
      <H1>Toppliste</H1>
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-grow">
          <H2>Spillere</H2>
          <Box>
            <ul className="mb-4 flex flex-wrap">
              <Tab
                active={activePlayerPanel === "rank"}
                onClick={() => setActivePlayerPanel("rank")}
              >
                Rank
              </Tab>
              <Tab
                active={activePlayerPanel === "money"}
                onClick={() => setActivePlayerPanel("money")}
              >
                Penger
              </Tab>
              <Tab
                active={activePlayerPanel === "racing"}
                onClick={() => setActivePlayerPanel("racing")}
              >
                Racingpoeng
              </Tab>
            </ul>
            {activePlayerPanel === "rank" ? (
              <CharacterList type="rank" sortBy="xp" />
            ) : activePlayerPanel === "money" ? (
              <CharacterList type="rank" sortBy="money" />
            ) : (
              <CharacterList type="rank" sortBy="racing" />
            )}
          </Box>
        </div>

        <div className="flex-grow">
          <H2>Familier</H2>
          <Box>
            <ul className="mb-4 flex flex-wrap">
              <Tab
                active={activeFamilyPanel === "power"}
                onClick={() => setActiveFamilyPanel("power")}
              >
                Makt
              </Tab>
              <Tab
                active={activeFamilyPanel === "wealth"}
                onClick={() => setActiveFamilyPanel("wealth")}
              >
                Formue
              </Tab>
            </ul>
            <FamilyList />
          </Box>
        </div>
      </div>
    </Main>
  );
};

export default Leaderboard;
