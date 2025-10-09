import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import CharacterList from "../components/CharacterList";

import { useState } from "react";

const FindPlayer = () => {
  const [searchText, setSearchText] = useState<string>("");

  const handleSearchTextInputChange = (e: any) => {
    setSearchText(e.target.value);
  };

  return (
    <Main>
      <H1>Finn spiller</H1>
      <div className="flex items-center gap-2">
        <label htmlFor="searchtext">
          <i className="fa-solid fa-magnifying-glass"></i>
        </label>
        <input
          className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
          id="searchtext"
          type="text"
          placeholder="Brukernavn"
          spellCheck={false}
          value={searchText}
          onChange={handleSearchTextInputChange}
        />
      </div>

      <CharacterList type="search" searchText={searchText} />
    </Main>
  );
};

export default FindPlayer;
