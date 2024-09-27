// Context
import { useCharacter } from "../CharacterContext";

// Components
import H1 from "../components/Typography/H1";

const Home = () => {
  const { character } = useCharacter();

  return (
    <div>
      {character ? <H1>Welcome {character.username}!</H1> : <H1>Welcome!</H1>}
      {character ? (
        <>
          <p>Health: {character.stats.hp}</p>
          <p>Experience: {character.stats.exp}</p>
          <p>Reputation - Police: {character.reputation.police}</p>
        </>
      ) : (
        <p>No character selected</p>
      )}
    </div>
  );
};

export default Home;
