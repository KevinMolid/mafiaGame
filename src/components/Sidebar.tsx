// React
import { Link } from "react-router-dom";

// Context
import { useCharacter } from "../CharacterContext";
import { useCooldown } from "../CooldownContext";

// Components
import SidebarLink from "./SidebarLink";
import Username from "./Typography/Username";

// Functions
import { getCurrentRank } from "../Functions/RankFunctions";

const Sidebar = () => {
  const { userCharacter } = useCharacter();
  const { cooldowns } = useCooldown();

  if (!userCharacter || userCharacter.status === "dead") return;

  return (
    <div className="hidden sm:block bg-neutral-800 px-4 py-8 text-sm leading-relaxed h-full pb-24">
      <div className="mb-6">
        <div className="relative">
          <Link to={`/profil/${userCharacter.id}`}>
            <img
              className="border border-neutral-500 w-[160px] h-[160px] object-cover m-auto mb-2 hover:cursor-pointer"
              src={userCharacter.img || "/default.jpg"}
              alt="Profile picture"
            />
          </Link>
        </div>

        {userCharacter ? (
          <div className="text-center text-stone-400">
            <Username character={userCharacter} />
            <p>{getCurrentRank(userCharacter.stats.xp)}</p>
          </div>
        ) : (
          <Link to="/nyspiller">
            <p className="text-center font-medium">Ny spiller</p>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        <SidebarLink to="/" icon="house">
          Hovedkvarter
        </SidebarLink>

        <SidebarLink to="butikk" icon="shop">
          Butikk
        </SidebarLink>

        <SidebarLink to="bank" icon="landmark">
          Bank
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="familie" icon="users">
          Familie
        </SidebarLink>

        <hr className="border-neutral-600" />

        {/*<SidebarLink to="innflytelse" icon="handshake-simple">
          Innflytelse
        </SidebarLink>

        <hr className="border-neutral-600" />*/}

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
        <SidebarLink to="streetracing" icon="flag-checkered">
          Streetracing
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

        <hr className="border-neutral-600" />

        <SidebarLink to="jackpot" icon="coins">
          Casino{" "}
        </SidebarLink>
      </nav>
    </div>
  );
};

export default Sidebar;
