// Context
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

// Components
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Equipment from "../components/Equipment";
import Button from "../components/Button";

// Functions
import { giveXP } from "../Functions/XpFunctions";

const Home = () => {
  const { character } = useCharacter();
  const { userData } = useAuth();

  const maxHealth = 100;
  const healthPercentage = character
    ? (character.stats.hp / maxHealth) * 100
    : 0;

  const maxXp = 500;
  const xpPercentage = character ? (character.stats.xp / maxXp) * 100 : 0;

  const maxHeat = 100;
  const heatPercentage = character ? (character.stats.heat / maxHeat) * 100 : 0;

  return (
    <div className="text-stone-400">
      {character ? <H1>Welcome {character.username}!</H1> : <H1>Welcome!</H1>}

      <Button onClick={() => giveXP(character, userData.activeCharacter, 1200)}>
        Get XP
      </Button>

      {character ? (
        <>
          <H2>Stats</H2>
          <div className="flex gap-4 mb-6">
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
          </div>

          <H2>Reputation</H2>
          <div className="flex gap-4 mb-6">
            <p>Police Force: {character.reputation.police}</p>
            <p>Political Corruption: {character.reputation.politics}</p>
            <p>Street Gangs: {character.reputation.gangs}</p>
            <p>Community Organizations: {character.reputation.community}</p>
          </div>

          <div className="flex flex-col gap-1">
            <H2>Equipment</H2>
            <Equipment />
          </div>
        </>
      ) : (
        <p>No character selected</p>
      )}
    </div>
  );
};

export default Home;
