import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import CharacterList from "../components/CharacterList";

const Leaderboard = () => {
  return (
    <section>
      <H1>Leaderboard</H1>
      <p>
        This is just a placeholder page for now. A functional Leaderboard is
        under development.
      </p>
      <H2>Rank</H2>
      <CharacterList include="all" action="link" />

      <H2>Money Rank</H2>
      <p>Player1</p>
      <p>Player2</p>
      <p>Player3</p>
    </section>
  );
};

export default Leaderboard;
