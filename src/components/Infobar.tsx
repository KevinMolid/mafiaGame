import Tooltip from "./Tooltip";

import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getRankProgress } from "../Functions/RankFunctions";

const Infobar = () => {
  const { userCharacter } = useCharacter();

  // Ensure that characterContext is defined before accessing its values
  if (
    !userCharacter ||
    !userCharacter.stats ||
    userCharacter.status === "dead"
  ) {
    return null;
  }

  const maxHealth = 100;
  const healthPercentage = userCharacter
    ? (userCharacter.stats.hp / maxHealth) * 100
    : 0;

  const { progress, minXP, maxXP } = getRankProgress(userCharacter.stats.xp);

  const maxHeat = 50;
  const heatPercentage = userCharacter
    ? (userCharacter.stats.heat / maxHeat) * 100
    : 0;

  return (
    <section className="bg-neutral-700 px-4 sm:px-8 py-2 flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 justify-center text-stone-400 text-sm sm:text-base">
      <div>
        <Tooltip label={`Helse: ${userCharacter.stats.hp}/${maxHealth}`}>
          <Link to="/" className="flex items-center gap-1 sm:gap-2">
            <i className="fa-solid fa-heart"></i>
            <div className="bg-neutral-800 h-1 w-20 sm:w-36">
              <div
                className="h-1 bg-green-500 transition-all duration-300"
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
          </Link>
        </Tooltip>
      </div>

      <div>
        <Tooltip
          label={`Xp: ${userCharacter.stats.xp - minXP} / ${maxXP - minXP}`}
        >
          <Link to="/" className="flex items-center gap-1 sm:gap-2">
            <p className="text-sm font-bold">XP</p>

            <div className="bg-neutral-800 h-1 w-20 sm:w-36">
              <div
                className="h-1 bg-slate-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </Link>
        </Tooltip>
      </div>

      <div>
        <Tooltip label={`Ettersøkt: ${heatPercentage}%`}>
          <Link to="/" className="flex items-center gap-1 sm:gap-2">
            <i className="fa-solid fa-fire-flame-curved"></i>{" "}
            <div className="bg-neutral-800 h-1 w-20 sm:w-36">
              <div
                className={
                  "h-1 transition-all duration-300 " +
                  (heatPercentage <= 25
                    ? "bg-yellow-400"
                    : heatPercentage <= 50
                    ? "bg-orange-400"
                    : "bg-red-400")
                }
                style={{ width: `${heatPercentage}%` }}
              ></div>
            </div>
          </Link>
        </Tooltip>
      </div>

      <Link to="/familie" className="flex items-center gap-1 sm:gap-2">
        <i className="fa-solid fa-users"></i>{" "}
        <Tooltip label="Familie">
          <p>{userCharacter.familyName || "Ingen familie"}</p>
        </Tooltip>
      </Link>

      <Link to="/flyplass" className="flex items-center gap-1 sm:gap-2">
        <i className="fa-solid fa-location-dot"></i>
        <Tooltip label="Lokasjon">
          <p>{userCharacter.location}</p>
        </Tooltip>
      </Link>

      <Link to="/bank" className="flex items-center gap-1 sm:gap-2">
        <i className="fa-solid fa-dollar-sign"></i>
        <Tooltip label="Penger">
          <p>{userCharacter.stats.money.toLocaleString("nb-NO")}</p>
        </Tooltip>
      </Link>

      <Link to="/" className="flex items-center gap-1 sm:gap-2">
        <i className="fa-solid fa-shield-halved"></i>
        <Tooltip label="Beskyttelse">
          <p>{userCharacter.stats.protection}%</p>
        </Tooltip>
      </Link>
    </section>
  );
};

export default Infobar;
