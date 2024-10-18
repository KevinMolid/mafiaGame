// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Equipment from "../components/Equipment";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";

import { getCurrentRank } from "../Functions/RankFunctions";

// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";

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
    <Main img="MafiaBg">
      <H1>Headquarters</H1>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex gap-4 mb-2">
        <Link to={`/profile/${character.id}`}>
          <img
            className="border border-neutral-500 size-36 object-cover mb-2 hover:cursor-pointer"
            src={character.img || "/default.jpg"}
            alt="Profile picture"
          />
        </Link>
        <div>
          <p>
            <Username character={character} />
          </p>
          <p>{getCurrentRank(character.stats.xp)}</p>
          <p>Money: ${character.stats.money.toLocaleString()}</p>
          <p>Bank: ${character.stats.bank.toLocaleString()}</p>
          <p>
            Family:{" "}
            <Link to={`family/profile/${character.familyId}`}>
              <strong className="text-neutral-200 hover:underline">
                {character.familyName}
              </strong>
            </Link>
          </p>
        </div>
      </div>

      {/* Button for testing only */}
      {false && <Button onClick={handleAction}>Get XP</Button>}

      {character ? (
        <>
          {/* Stats */}
          <div className="border border-neutral-500 p-4 mb-4">
            <H2>Stats</H2>
            <div className="flex flex-col lg:flex-row flex-wrap gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <p>
                  Health:{" "}
                  <strong className="text-neutral-200">
                    {healthPercentage}%
                  </strong>
                </p>
                <div className="h-5 min-w-52 w-full bg-neutral-700 grid grid-cols-1">
                  <div
                    className="h-5 bg-green-500 transition-all duration-300 flex justify-center items-center col-start-1 row-start-1"
                    style={{ width: `${healthPercentage}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-slate-50 text-xs">
                      {character.stats.hp} / {maxHealth} hp
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p>
                  Experience:{" "}
                  <strong className="text-neutral-200">
                    {progress.toFixed(2)}%
                  </strong>
                </p>
                <div className="bg-neutral-700 h-5 min-w-52 w-full grid grid-cols-1">
                  <div
                    className="h-5 bg-slate-400 transition-all duration-300 col-start-1 row-start-1"
                    style={{ width: `${progress}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-slate-50 text-xs">
                      {xp - minXP} / {maxXP - minXP} xp
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p>
                  Heat:{" "}
                  <strong className="text-neutral-200">
                    {heatPercentage}%
                  </strong>
                </p>
                <div className="bg-neutral-700 h-5 min-w-52 w-full grid grid-cols-1">
                  <div
                    className="h-5 bg-red-400 transition-all duration-300 col-start-1 row-start-1"
                    style={{ width: `${heatPercentage}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-red-50 text-xs">
                      {character.stats.heat} / 100 heat
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reputation */}
          <div className="border border-neutral-500 p-4 mb-4">
            <H2>Reputation</H2>
            <div className="flex gap-x-4 flex-wrap">
              <p>
                Police Force:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.police}
                </strong>
              </p>
              <p>
                Political Corruption:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.politics}
                </strong>
              </p>
              <p>
                Street Gangs:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.gangs}
                </strong>
              </p>
              <p>
                Community Organizations:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.community}
                </strong>
              </p>
            </div>
          </div>

          <div className="border border-neutral-500 mb-4 grid grid-cols-1 w-fit">
            <div className="col-start-1 row-start-1 z-10 p-4">
              <H2>Equipment</H2>
            </div>
            <div className="col-start-1 row-start-1">
              <Equipment />
            </div>
          </div>
        </>
      ) : (
        <p>No character selected</p>
      )}
    </Main>
  );
};

export default Home;
