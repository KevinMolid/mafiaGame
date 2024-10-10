// React
import { Link } from "react-router-dom";
import { useState } from "react";

// Context
import { useCharacter } from "../CharacterContext";

// Functions
import { getCurrentRank } from "../Functions/RankFunctions";

const Sidebar = () => {
  const { character } = useCharacter();
  const [showNav, setShowNav] = useState(false);

  if (!character) {
    return null;
  }

  const toggleNav = () => {
    setShowNav(!showNav);
  };

  return (
    <div className="hidden sm:block bg-neutral-800 p-8 text-sm leading-relaxed pb-16">
      <div className="mb-6">
        <div className="relative">
          <img
            className="border border-neutral-500 size-36 object-cover m-auto mb-2 hover:cursor-pointer"
            src={character.img || "/default.jpg"}
            alt="Profile picture"
            onClick={toggleNav}
          />
          {showNav && (
            <nav className="bg-sky-800 border border-neutral-500 absolute bottom-0 right-[-130px]">
              <ul>
                <li className="hover:bg-sky-900 py-2 px-4">
                  <Link
                    to={`/profile/${character.id}`}
                    className="flex gap-2 items-center"
                  >
                    <i className="fa-solid fa-user"></i> Show profile
                  </Link>
                </li>
                <li className="hover:bg-sky-900 py-2 px-4">
                  <Link to="/editprofile" className="flex gap-2 items-center">
                    <i className="fa-solid fa-pen"></i> Edit profile
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {character ? (
          <Link to={`/profile/${character.id}`}>
            <p className="text-center font-medium">{character.username}</p>
          </Link>
        ) : (
          <Link to="/createcharacter">
            <p className="text-center font-medium">Create character</p>
          </Link>
        )}
        <p className="text-center text-stone-400">
          {getCurrentRank(character.stats.xp)}
        </p>
      </div>

      {/* Navigation */}
      <nav>
        <Link to="/selectcharacater">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-people-group"></i> Select Characater
          </h2>
        </Link>
        <Link to="/chat">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-comment-dots"></i> Chat
          </h2>
        </Link>

        <Link to="/influence">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-handshake-simple"></i> Influence
          </h2>
        </Link>

        {/*<h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-globe"></i> Underground
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Gambling</li>
          <li>Underground Fighting</li>
          <li>Black Market</li>
        </ul>*/}

        <Link to="/streetcrime">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-money-bill"></i> Street crimes
          </h2>
        </Link>

        {/*<h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-briefcase"></i> Organized Crime
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Robbery</li>
          <li>Drug Dealing</li>
          <li>Loan Sharking</li>
          <li>Kidnapping</li>
        </ul>*/}

        {/*<h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-ship"></i> Syndicate Operations
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Smuggling</li>
          <li>Assassination Contracts</li>
          <li>Heists</li>
          <li>Bribery and Corruption</li>
        </ul>*/}

        {/*<h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-globe"></i> Global Crimes
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>International Smuggling</li>
          <li>Political Assassinations</li>
          <li>Money Laundering</li>
          <li>Mafia Wars</li>
        </ul>*/}

        <Link to="/parking">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-square-parking"></i> Parking
          </h2>
        </Link>

        <Link to="/family">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-users"></i> Family
          </h2>
        </Link>

        <Link to="/prison">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-handcuffs"></i> Prison
          </h2>
        </Link>

        <Link to="/travel">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-plane"></i> Travel
          </h2>
        </Link>

        <Link to="/assassinate">
          <h2 className="uppercase text-xs pb-1 text-stone-400">
            <i className="fa-solid fa-gun"></i> Assassinate
          </h2>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
