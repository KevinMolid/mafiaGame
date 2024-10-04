// React
import { useState, useEffect } from "react";

// Context
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

// Components
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Equipment from "../components/Equipment";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

// Functions
import { attemptReward } from "../Functions/RewardFunctions";
import { getRankProgress } from "../Functions/RankFunctions";

const Home = () => {
  const { character, setCharacter } = useCharacter();
  const { userData } = useAuth();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  // Local state for XP, initialized with the character's current XP
  const [xp, setXP] = useState<number>(character?.stats.xp || 0);

  // Sync the local XP state with character stats if character changes
  useEffect(() => {
    if (character) {
      setXP(character.stats.xp);
    }
  }, [character]); // Runs whenever character object changes

  if (!character) {
    return null;
  }

  const handleAction = async () => {
    const xpReward = 50; // Define the XP reward for this action
    const moneyReward = 50; // Define the money reward for this action
    const successRate = 1.0; // Define the success rate for the action (80%)

    await attemptReward({
      character,
      activeCharacter: userData.activeCharacter,
      xpReward, // Pass the XP reward
      moneyReward, // Pass the money reward
      successMessage: `Action successful!`, // Define success message
      failureMessage: `Action failed. Better luck next time!`, // Define failure message
      successRate, // Pass the success rate
      setCharacter, // Update character state
      setMessage, // Update message state
      setMessageType, // Update message type
    });
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

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* Button for testing only */}
      {false && <Button onClick={handleAction}>Get XP</Button>}

      {character ? (
        <>
          <H2>Stats</H2>
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 mb-6">
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
