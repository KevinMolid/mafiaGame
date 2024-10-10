// React
import { Link } from "react-router-dom";
import { useState } from "react";

// Context
import { useCharacter } from "../CharacterContext";

// Components
import SidebarLink from "./SidebarLink";

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

          {/* Character dropdown menu*/}
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
      <nav className="flex flex-col gap-2">
        <SidebarLink to="selectcharacater" icon="people-group">
          Select Character
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="chat" icon="comment-dots">
          Chat
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="influence" icon="handshake-simple">
          Influence
        </SidebarLink>

        <hr className="border-neutral-600" />

        {/*<h2 className="uppercase text-xs pb-1 text-stone-400">
          <i className="fa-solid fa-globe"></i> Underground
        </h2>
        <ul className="text-stone-200 mb-4">
          <li>Gambling</li>
          <li>Underground Fighting</li>
          <li>Black Market</li>
        </ul>*/}

        <SidebarLink to="streetcrime" icon="money-bill">
          Street crime
        </SidebarLink>

        <hr className="border-neutral-600" />

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

        <SidebarLink to="prison" icon="handcuffs">
          Prison
        </SidebarLink>

        <SidebarLink to="parking" icon="square-parking">
          Parking
        </SidebarLink>

        <SidebarLink to="travel" icon="plane">
          Travel
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="assassinate" icon="gun">
          Assassinate
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="family" icon="users">
          Family
        </SidebarLink>
      </nav>
    </div>
  );
};

export default Sidebar;
