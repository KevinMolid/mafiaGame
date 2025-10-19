// Context
import { useCharacter } from "../CharacterContext";
import { useCooldown } from "../CooldownContext";

import { compactMmSs } from "../Functions/TimeFunctions";

// Components
import SidebarLink from "./SidebarLink";

const Sidebar = () => {
  const { userCharacter } = useCharacter();
  const { cooldowns } = useCooldown();
  const { jailRemainingSeconds } = useCooldown();

  if (!userCharacter || userCharacter.status === "dead") return;

  return (
    <div className="hidden lg:block bg-neutral-900 py-8 leading-relaxed h-full pb-24 border-r border-neutral-700">
      {/* Navigation */}
      <nav className="flex flex-col">
        <SidebarLink to="/" icon="house">
          Hovedkvarter
        </SidebarLink>

        <SidebarLink to="marked" icon="shop">
          Marked
        </SidebarLink>

        <SidebarLink to="bank" icon="landmark">
          Bank
        </SidebarLink>

        <hr className="border-neutral-600 my-2 mx-4" />

        <SidebarLink to="familie" icon="users">
          Familie
        </SidebarLink>

        <hr className="border-neutral-600 my-2 mx-4" />

        {/*<SidebarLink to="innflytelse" icon="handshake-simple">
          Innflytelse
        </SidebarLink>

        <hr className="border-neutral-600" />*/}

        <SidebarLink to="kriminalitet" icon="money-bill">
          <div>Kriminalitet</div>
          {cooldowns["crime"] > 0 ? (
            <div className="text-neutral-200 font-medium">
              {compactMmSs(cooldowns["crime"])}
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
              {compactMmSs(cooldowns["gta"])}
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
              {compactMmSs(cooldowns["robbery"])}
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

        <hr className="border-neutral-600 my-2 mx-4" />

        <SidebarLink to="streetracing" icon="flag-checkered">
          Streetracing
        </SidebarLink>

        <SidebarLink to="produksjon" icon="industry">
          Produksjon
        </SidebarLink>

        <SidebarLink to="hacking" icon="laptop">
          Hacking
        </SidebarLink>

        <hr className="border-neutral-600 my-2 mx-4" />

        <SidebarLink to="fengsel" icon={`handcuffs`}>
          <div>Fengsel</div>
          {jailRemainingSeconds > 0 ? (
            <div className="text-neutral-200 font-medium">
              {compactMmSs(jailRemainingSeconds)}
            </div>
          ) : (
            <></>
          )}
        </SidebarLink>

        <SidebarLink to="parkering" icon="square-parking">
          Parkering
        </SidebarLink>

        <SidebarLink to="flyplass" icon="plane">
          Flyplass
        </SidebarLink>

        <hr className="border-neutral-600 my-2 mx-4" />

        <SidebarLink to="casino" icon="coins">
          Casino{" "}
        </SidebarLink>
      </nav>
    </div>
  );
};

export default Sidebar;
