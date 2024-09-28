// React
import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getRank } from "../Functions/RankFunctions";

const Sidebar = () => {
  const { character } = useCharacter();

  return (
    <div className="bg-neutral-800 p-8 text-sm leading-relaxed">
      <div className="mb-6">
        <img
          className="border border-neutral-500 size-36 object-cover m-auto mb-2"
          src="src\assets\default.jpg"
          alt="Profile picture"
        />
        {character ? (
          <Link to="/">
            <p className="text-center font-medium">{character.username}</p>
          </Link>
        ) : (
          <Link to="/createcharacter">
            <p className="text-center font-medium">Create character</p>
          </Link>
        )}
        <p className="text-center text-stone-400">
          {getRank(character.stats.xp)}
        </p>
      </div>
      <nav>
        <h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-handshake-simple"></i> Reputation
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>
            <Link to="/influence">Influence</Link>
          </li>
        </ul>
        <h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-globe"></i> Underground
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Gambling</li>
          <li>Underground Fighting</li>
          <li>Black Market</li>
        </ul>
        <Link to="/streetcrime">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-money-bill"></i> Street crimes
          </h2>
        </Link>
        <ul className="text-stone-200 mb-4">
          <li>Pickpocketing</li>
          <li>Vandalism</li>
          <li>Protection Racket</li>
          <li>Street Racing</li>
        </ul>
        <h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-briefcase"></i> Organized Crime
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Robbery</li>
          <li>Drug Dealing</li>
          <li>Loan Sharking</li>
          <li>Kidnapping</li>
        </ul>
        <h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-ship"></i> Syndicate Operations
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Smuggling</li>
          <li>Assassination Contracts</li>
          <li>Heists</li>
          <li>Bribery and Corruption</li>
        </ul>
        <h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-globe"></i> Global Crimes
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>International Smuggling</li>
          <li>Political Assassinations</li>
          <li>Money Laundering</li>
          <li>Mafia Wars</li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
