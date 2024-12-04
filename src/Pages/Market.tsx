import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import { useState } from "react";
import Tab from "../components/Tab";

import Suitcases from "../components/Suitcases";
import Cardealer from "../components/Cardealer";
import Airplanedealer from "../components/Airplanedealer";

const Market = () => {
  const [activePanel, setActivePanel] = useState<
    "suitcases" | "cars" | "airplanes" | "diamonds" | "blackMarket"
  >("cars");

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
    </Main>
  );
};

export default Market;
