import CharacterListAdmin from "./CharacterListAdmin";
import CharacterListJail from "./CharacterListJail";
import CharacterListRank from "./CharacterListRank";
import CharacterListSearch from "./CharacterListSearch";

export default function CharacterList({
  type = "" as "rank" | "admin" | "search" | "jail" | "",
  sortBy = "" as "username" | "rank" | "money",
  inJail = false,
  searchText = "",
}: any) {
  if (type === "admin") return <CharacterListAdmin />;
  if (type === "jail") return <CharacterListJail inJail={inJail} />;
  if (type === "rank") return <CharacterListRank sortBy={sortBy} />;
  if (type === "search") return <CharacterListSearch searchText={searchText} />;
  return <div></div>;
}
