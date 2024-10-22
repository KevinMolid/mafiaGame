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
  const { cooldowns, fetchCooldown } = useCooldown();
  const [showNav, setShowNav] = useState(false);

  const characterMenuRef = useRef<HTMLDivElement | null>(null);
  const characterAvatarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (character) {
      fetchCooldown("crime", 90, character.id);
      fetchCooldown("gta", 240, character.id);
      fetchCooldown("robbery", 300, character.id);
    }
  }, [character?.id]);

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
                    to={`/profil/${character.id}`}
                    className="flex gap-2 items-center"
                    onClick={() => setShowNav(false)}
                  >
                    <i className="fa-solid fa-user"></i> Vis profil
                  </Link>
                </li>
                <li className="hover:bg-sky-900 py-2 px-4">
                  <Link
                    to="/endreprofil"
                    className="flex gap-2 items-center"
                    onClick={() => setShowNav(false)}
                  >
                    <i className="fa-solid fa-pen"></i> Endre profil
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
          <Link to="/nyspiller">
            <p className="text-center font-medium">Ny spiller</p>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        <SidebarLink to="bank" icon="landmark">
          Bank
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="familie" icon="users">
          Familie
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="innflytelse" icon="handshake-simple">
          Innflytelse
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="kriminalitet" icon="money-bill">
          <div>Kriminalitet</div>
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

        <SidebarLink to="biltyveri" icon="car">
          <div>Biltyveri</div>
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

        <SidebarLink to="ran" icon="sack-dollar">
          <div>Ran spiller</div>
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

        <SidebarLink to="drep" icon="gun">
          Drep spiller
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="fengsel" icon="handcuffs">
          Fengsel
        </SidebarLink>

        <SidebarLink to="parkering" icon="square-parking">
          Parkering
        </SidebarLink>

        <SidebarLink to="flyplass" icon="plane">
          Flyplass
        </SidebarLink>
      </nav>
    </div>
  );
};

export default Sidebar;
