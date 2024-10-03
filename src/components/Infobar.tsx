import Tooltip from "./Tooltip";

// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getRankProgress } from "../Functions/RankFunctions";

const Infobar = () => {
  const { character } = useCharacter();

  // Ensure that characterContext is defined before accessing its values
  if (!character || !character.stats) {
    return null;
  }

  const maxHealth = 100;
  const healthPercentage = character
    ? (character.stats.hp / maxHealth) * 100
    : 0;

  const { progress, minXP, maxXP } = getRankProgress(character.stats.xp);

  const maxHeat = 100;
  const heatPercentage = character ? (character.stats.heat / maxHeat) * 100 : 0;

  return (
    <section className="bg-neutral-700 px-4 sm:px-8 py-2 flex flex-wrap gap-x-6 gap-y-2 justify-center text-stone-400 text-sm sm:text-base">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-heart"></i>
        <Tooltip label="Health bar">
          <div className="bg-neutral-800 h-1 w-20 sm:w-36">
            <div
              className="h-1 bg-green-500 transition-all duration-300"
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-sm font-bold">XP</p>
        <Tooltip label={`${character.stats.xp - minXP} / ${maxXP - minXP}`}>
          <div className="bg-neutral-800 h-1 w-20 sm:w-36">
            <div
              className="h-1 bg-slate-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-fire-flame-curved"></i>{" "}
        <Tooltip label="Heat">
          <div className="bg-neutral-800 h-1 w-20 sm:w-36">
            <div
              className="h-1 bg-red-500 transition-all duration-300"
              style={{ width: `${heatPercentage}%` }}
            ></div>
          </div>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-user-group"></i>{" "}
        <Tooltip label="Family">
          <p>Norwegian Gangsters</p>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-location-dot"></i>
        <Tooltip label="Location">
          <p>{character.location}</p>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-dollar-sign"></i>
        <Tooltip label="Money">
          <p>{character.stats.money.toLocaleString()}</p>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <i className="fa-solid fa-shield-halved"></i>
        <Tooltip label="Protection">
          <p>{character.stats.protection}%</p>
        </Tooltip>
      </div>
    </section>
  );
};

export default Infobar;
