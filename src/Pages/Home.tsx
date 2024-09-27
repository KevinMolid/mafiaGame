// Context
import { useCharacter } from "../CharacterContext";

// Components
import H1 from "../components/Typography/H1";

const Home = () => {
  const { character } = useCharacter();

  const maxHealth = 100;
  const healthPercentage = character
    ? (character.stats.hp / maxHealth) * 100
    : 0;

  return (
    <div>
      {character ? <H1>Welcome {character.username}!</H1> : <H1>Welcome!</H1>}
      {character ? (
        <>
          <p>
            Health: {character.stats.hp} / {healthPercentage}
          </p>
          <div className="h-1 w-[200px] bg-neutral-700">
            <div
              className="h-1 bg-green-500 transition-all duration-300"
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
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
