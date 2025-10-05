import CharacterListAdmin from "./CharacterListAdmin";
import CharacterListJail from "./CharacterListJail";
import CharacterListRank from "./CharacterListRank";

export default function CharacterList({
  type = "" as "rank" | "admin" | "chat" | "jail" | "",
  sortBy = "" as "username" | "rank" | "money",
}: any) {
  if (type === "admin") return <CharacterListAdmin />;
  if (type === "jail") return <CharacterListJail />;
  if (type === "rank") return <CharacterListRank sortBy={sortBy} />;
  return <div></div>;
}
