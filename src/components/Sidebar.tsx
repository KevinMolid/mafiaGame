// React
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Context
import { useCharacter } from "../CharacterContext";
import { useCooldown } from "../CooldownContext";

// Components
import SidebarLink from "./SidebarLink";
import Username from "./Typography/Username";

// Functions
import { getCurrentRank } from "../Functions/RankFunctions";

const Sidebar = () => {
  const { character } = useCharacter();
  const [showNav, setShowNav] = useState(false);

  const { cooldowns } = useCooldown();

  const characterMenuRef = useRef<HTMLDivElement | null>(null);
  const characterAvatarRef = useRef<HTMLDivElement | null>(null);

  const toggleNav = () => {
    setShowNav(!showNav);
  };

  // Close menu if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        characterMenuRef.current &&
        !characterMenuRef.current.contains(event.target as Node) &&
        characterAvatarRef.current &&
        !characterAvatarRef.current.contains(event.target as Node) &&
        showNav
      ) {
        setShowNav(false); // Close character menu if clicking outside
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNav]); // Listen only when Character Menu open

  // Render null if character is not available
  if (!character) {
    return null;
  }

  return (
    <div className="hidden sm:block bg-neutral-800 px-4 py-8 text-sm leading-relaxed h-full pb-24">
      <div className="mb-6">
        <div className="relative">
          <div ref={characterAvatarRef}>
            <img
              className="border border-neutral-500 size-36 object-cover m-auto mb-2 hover:cursor-pointer"
              src={character.img || "/default.jpg"}
              alt="Profile picture"
              onClick={toggleNav}
            />
          </div>

          {/* Character dropdown menu*/}
          {showNav && (
            <div
              className="bg-sky-800 border border-neutral-500 absolute bottom-0 right-[-130px]"
              ref={characterMenuRef}
            >
              <ul>
                <li className="hover:bg-sky-900 py-2 px-4">
                  <Link
                    to={`/profile/${character.id}`}
                    className="flex gap-2 items-center"
                    onClick={() => setShowNav(false)}
                  >
                    <i className="fa-solid fa-user"></i> Show profile
                  </Link>
                </li>
                <li className="hover:bg-sky-900 py-2 px-4">
                  <Link
                    to="/editprofile"
                    className="flex gap-2 items-center"
                    onClick={() => setShowNav(false)}
                  >
                    <i className="fa-solid fa-pen"></i> Edit profile
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {character ? (
          <div className="text-center text-stone-400">
            <Username character={character} />
            <p>{getCurrentRank(character.stats.xp)}</p>
          </div>
        ) : (
          <Link to="/createcharacter">
            <p className="text-center font-medium">Create character</p>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        <SidebarLink to="selectcharacater" icon="people-group">
          Select Character
        </SidebarLink>

        <SidebarLink to="bank" icon="landmark">
          Bank
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="family" icon="users">
          Family
        </SidebarLink>

        <SidebarLink to="chat" icon="comment-dots">
          Chat
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="influence" icon="handshake-simple">
          Influence
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="streetcrime" icon="money-bill">
          <div>Street crime</div>
          {cooldowns["crime"] > 0 ? (
            <div className="text-neutral-200 font-medium">
              {cooldowns["crime"]}
            </div>
          ) : (
            <div className="text-green-400">
              <i className="fa-solid fa-check"></i>
            </div>
          )}
        </SidebarLink>

        <SidebarLink to="gta" icon="car">
          <div>Grand Theft Auto</div>
          {cooldowns["gta"] > 0 ? (
            <div className="text-neutral-200 font-medium">
              {cooldowns["gta"]}
            </div>
          ) : (
            <div className="text-green-400">
              <i className="fa-solid fa-check"></i>
            </div>
          )}
        </SidebarLink>

        <SidebarLink to="robbery" icon="sack-dollar">
          <div>Robbery</div>
          {cooldowns["robbery"] > 0 ? (
            <div className="text-neutral-200 font-medium">
              {cooldowns["robbery"]}
            </div>
          ) : (
            <div className="text-green-400">
              <i className="fa-solid fa-check"></i>
            </div>
          )}
        </SidebarLink>

        <SidebarLink to="assassinate" icon="gun">
          Assassinate
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="prison" icon="handcuffs">
          Prison
        </SidebarLink>

        <SidebarLink to="parking" icon="square-parking">
          Parking
        </SidebarLink>

        <SidebarLink to="travel" icon="plane">
          Travel
        </SidebarLink>
      </nav>
    </div>
  );
};

export default Sidebar;
