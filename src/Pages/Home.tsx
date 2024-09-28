// Context
import { useCharacter } from "../CharacterContext";

// Components
import H1 from "../components/Typography/H1";
import Equipment from "../components/Equipment";

const Home = () => {
  const { character } = useCharacter();

  const maxHealth = 100;
  const healthPercentage = character
    ? (character.stats.hp / maxHealth) * 100
    : 0;

  const maxXp = 500;
  const xpPercentage = character ? (character.stats.xp / maxXp) * 100 : 0;

  const maxHeat = 100;
  const heatPercentage = character ? (character.stats.heat / maxHeat) * 100 : 0;

  return (
    <div>
      {character ? <H1>Welcome {character.username}!</H1> : <H1>Welcome!</H1>}

      {character ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p>
              Health: {character.stats.hp} / {healthPercentage}
            </p>
            <div className="h-1 w-[250px] bg-neutral-700">
              <div
                className="h-1 bg-green-500 transition-all duration-300"
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p>Experience: {character.stats.xp}</p>
            <div className="bg-neutral-700 h-1 w-[250px]">
              <div
                className="h-1 bg-slate-400 transition-all duration-300"
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p>Heat: {character.stats.heat} / 100</p>
            <div className="bg-neutral-700 h-1 w-[250px]">
              <div
                className="h-1 bg-red-400 transition-all duration-300"
                style={{ width: `${heatPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h2>Reputation</h2>
            <p>Police Force: {character.reputation.police}</p>
          </div>

          <h2>Equipment</h2>
          <Equipment />
        </div>
      ) : (
        <p>No character selected</p>
      )}
    </div>
  );
};

export default Home;
