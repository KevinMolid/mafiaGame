import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import { useEffect, useMemo, useState } from "react";
import Tab from "../components/Tab";

import Suitcases from "../components/Suitcases";
import Cardealer from "../components/Cardealer";
import Airplanedealer from "../components/Airplanedealer";

type Panel = "suitcases" | "cars" | "airplanes" | "diamonds" | "blackMarket";

const STORAGE_KEY = "market:activePanel";

const Market = () => {
  // Validate stored value safely
  const isValid = (v: any): v is Panel =>
    v === "suitcases" ||
    v === "cars" ||
    v === "airplanes" ||
    v === "diamonds" ||
    v === "blackMarket";

  // Read once on mount
  const initialPanel = useMemo<Panel>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isValid(saved) ? saved : "cars";
  }, []);

  const [activePanel, setActivePanel] = useState<Panel>(initialPanel);

  // Keep storage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activePanel);
  }, [activePanel]);

  return (
    <Main>
      <H1>Marked</H1>

      {/* Tabs */}
      <ul className="mb-8 flex flex-wrap">
        <Tab
          active={activePanel === "suitcases"}
          onClick={() => setActivePanel("suitcases")}
        >
          Kofferter
        </Tab>
        <Tab
          active={activePanel === "cars"}
          onClick={() => setActivePanel("cars")}
        >
          Bilforhandler
        </Tab>
        <Tab
          active={activePanel === "airplanes"}
          onClick={() => setActivePanel("airplanes")}
        >
          Flyforhandler
        </Tab>
        <Tab
          active={activePanel === "diamonds"}
          onClick={() => setActivePanel("diamonds")}
        >
          Diamanter
        </Tab>
        <Tab
          active={activePanel === "blackMarket"}
          onClick={() => setActivePanel("blackMarket")}
        >
          Svartebørsen
        </Tab>
      </ul>

      {activePanel === "suitcases" && <Suitcases />}
      {activePanel === "cars" && <Cardealer />}
      {activePanel === "airplanes" && <Airplanedealer />}
      {/* Render placeholders or components for the other tabs when ready */}
    </Main>
  );
};

export default Market;
