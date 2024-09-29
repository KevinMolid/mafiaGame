// React
import { useState } from "react";

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
import { getRankProgress } from "../Functions/RankFunctions";

const Home = () => {
  const { character, setCharacter } = useCharacter();
  const { userData } = useAuth();

  if (!character) {
    return null;
  }

  const [xp, setXP] = useState(character.stats.xp); // Local state for XP

  const handleGiveXP = async (xpToAdd: number) => {
    // Call the giveXP function
    const updatedXP = await giveXP(
      character,
      userData.activeCharacter,
      xpToAdd
    );

    // After successfully updating in Firebase, update the local state
    if (updatedXP) {
      setXP(updatedXP); // Update XP in the state
      setCharacter((prevCharacter: any) => ({
        ...prevCharacter,
        stats: { ...prevCharacter.stats, xp: updatedXP },
      }));
    }
  };

  const maxHealth = 100;
  const healthPercentage = character
    ? (character.stats.hp / maxHealth) * 100
    : 0;

  const { progress, minXP, maxXP } = getRankProgress(character.stats.xp);

  const maxHeat = 100;
  const heatPercentage = character ? (character.stats.heat / maxHeat) * 100 : 0;

  return (
    <div className="text-stone-400">
      {character ? <H1>Welcome {character.username}!</H1> : <H1>Welcome!</H1>}

      <Button onClick={() => handleGiveXP(50)}>Get XP</Button>

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
              <p>
                Experience: {xp - minXP} / {maxXP - minXP}
              </p>
              <div className="bg-neutral-700 h-1 w-[250px]">
                <div
                  className="h-1 bg-slate-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
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
