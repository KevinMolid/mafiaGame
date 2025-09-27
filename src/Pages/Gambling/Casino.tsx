import Main from "../../components/Main";
import Jackpot from "./Jackpot";
import BlackJack from "./BlackJack";
import Tab from "../../components/Tab";
import H1 from "../../components/Typography/H1";

import { useState, useMemo, useEffect } from "react";

const STORAGE_KEY = "casino:activePanel";
type Panel = "jackpot" | "blackjack";

const Casino = () => {
  const isValid = (v: any): v is Panel => v === "jackpot" || v === "blackjack";

  // Read once on mount
  const initialPanel = useMemo<Panel>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return isValid(saved) ? saved : "jackpot";
    } catch {
      return "jackpot";
    }
  }, []);

  const [activePanel, setActivePanel] = useState<Panel>(initialPanel);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activePanel);
    } catch {}
  }, [activePanel]);

  return (
    <Main>
      <H1>Casino</H1>

      <ul className="mb-8 flex flex-wrap">
        <Tab
          active={activePanel === "jackpot"}
          onClick={() => setActivePanel("jackpot")}
        >
          Jackpot
        </Tab>
        <Tab
          active={activePanel === "blackjack"}
          onClick={() => setActivePanel("blackjack")}
        >
          BlackJack
        </Tab>
      </ul>

      {activePanel === "jackpot" && <Jackpot />}
      {activePanel === "blackjack" && <BlackJack />}
    </Main>
  );
};

export default Casino;
