// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Equipment from "../components/Equipment";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import Box from "../components/Box";

import { getCurrentRank } from "../Functions/RankFunctions";

// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getRankProgress } from "../Functions/RankFunctions";

const Home = () => {
  const { userCharacter } = useCharacter();
  const [message] = useState("");
  const [messageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  // Local state for XP, initialized with the character's current XP
  const [xp, setXP] = useState<number>(userCharacter?.stats.xp || 0);

  const bags = ["", "", "", "", "", "", "", "", "", "", "", ""];

  // Sync the local XP state with character stats if character changes
  useEffect(() => {
    if (userCharacter) {
      setXP(userCharacter.stats.xp);
    }
  }, [userCharacter]); // Runs whenever character object changes

  if (!userCharacter) {
    return null;
  }

  const maxHealth = 100;
  const healthPercentage = userCharacter
    ? (userCharacter.stats.hp / maxHealth) * 100
    : 0;

  const { progress, minXP, maxXP } = getRankProgress(userCharacter.stats.xp);

  const maxHeat = 50;
  const heatPercentage = userCharacter
    ? Math.round((userCharacter.stats.heat / maxHeat) * 100)
    : 0;

  return (
    <Main img="MafiaBg">
      <H1>Hovedkvarter</H1>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex gap-4 mb-2">
        <Link to={`/profil/${userCharacter.id}`}>
          <img
            className="border border-neutral-500 size-[160px] object-cover mb-2 hover:cursor-pointer"
            src={userCharacter.img || "/default.jpg"}
            alt="Profile picture"
          />
        </Link>
        <div>
          <p>
            <Username character={userCharacter} />
          </p>
          <Link to="/spillguide">
            <p>{getCurrentRank(userCharacter.stats.xp)}</p>
          </Link>
          <Link to="/bank">
            <p>Penger: ${userCharacter.stats.money.toLocaleString()}</p>
          </Link>
          <Link to="/bank">
            <p>
              Bank: $
              {userCharacter.stats.bank
                ? userCharacter.stats.bank.toLocaleString()
                : "0"}
            </p>
          </Link>
          <p>
            Familie:{" "}
            {userCharacter.familyName ? (
              <Link to={`familie/profil/${userCharacter.familyId}`}>
                <strong className="text-neutral-200 hover:underline">
                  {userCharacter.familyName}
                </strong>
              </Link>
            ) : (
              <Link to="/familie">Ingen familie</Link>
            )}
          </p>
        </div>
      </div>

      {userCharacter ? (
        <div className="flex gap-4 flex-wrap">
          {/* Stats */}
          <Box>
            <H2>Status</H2>
            <div className="flex flex-col lg:flex-row flex-wrap gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <p>
                  Helse:{" "}
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
                      {userCharacter.stats.hp} / {maxHealth} hp
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p>
                  Erfaring:{" "}
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
                  Ettersøkt:{" "}
                  <strong className="text-neutral-200">
                    {heatPercentage}%
                  </strong>
                </p>
                <div className="bg-neutral-700 h-5 min-w-52 w-full grid grid-cols-1">
                  <div
                    className={
                      "h-5 transition-all duration-300 col-start-1 row-start-1 " +
                      (heatPercentage <= 25
                        ? "bg-yellow-400"
                        : heatPercentage <= 50
                        ? "bg-orange-400"
                        : "bg-red-400")
                    }
                    style={{ width: `${heatPercentage}%` }}
                  ></div>
                  <div className="flex justify-center items-center z-10 col-start-1 row-start-1">
                    <p className="text-red-50 text-xs">
                      {userCharacter.stats.heat} / 50
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Box>

          {/* Reputation */}
          {/*<Box>
            <H2>Innflytelse</H2>
            <div className="flex gap-x-4 flex-wrap">
              <p>
                Politi:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.police}
                </strong>
              </p>
              <p>
                Styresmakter:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.politics}
                </strong>
              </p>
              <p>
                Gjenger:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.gangs}
                </strong>
              </p>
              <p>
                Organisasjoner:{" "}
                <strong className="text-neutral-200">
                  {character.reputation.community}
                </strong>
              </p>
            </div>
          </Box>*/}

          {/* Equipment */}
          <div className="border border-neutral-500 mb-4 grid grid-cols-1 w-fit">
            <div className="col-start-1 row-start-1 z-10 p-4">
              <H2>Utstyr</H2>
            </div>
            <div className="col-start-1 row-start-1">
              <Equipment />
            </div>
          </div>

          {/* Bags */}
          <Box>
            <H2>Eiendeler</H2>
            <ul className="flex gap-1 flex-wrap">
              {bags.map((bag, index) => {
                return (
                  <li key={bag + index}>
                    <div className="w-14 h-14 border-2 border-neutral-600 rounded-xl"></div>
                  </li>
                );
              })}
            </ul>
          </Box>
        </div>
      ) : (
        <p>Ingen spiller funnet.</p>
      )}
    </Main>
  );
};

export default Home;
