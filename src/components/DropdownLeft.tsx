import SidebarLink from "./SidebarLink";

import { useCooldown } from "../CooldownContext";
import { useMenuContext } from "../MenuContext";

const DropdownLeft = () => {
  const { actionsOpen, toggleActions } = useMenuContext();
  const { cooldowns } = useCooldown();

  return (
    actionsOpen && (
      <nav className="absolute z-30 top-0 left-0 flex flex-col gap-2 bg-neutral-950 p-4 sm:hidden min-w-56 select-none border-r border-neutral-500 h-full">
        <p>Handlinger</p>
        <hr className="border-neutral-500" />

        <SidebarLink to="/" icon="house" onClick={toggleActions}>
          Hovedkvarter
        </SidebarLink>

        <SidebarLink to="butikk" icon="shop" onClick={toggleActions}>
          Butikk
        </SidebarLink>

        <SidebarLink to="/bank" icon="landmark" onClick={toggleActions}>
          Bank
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="/familie" icon="users" onClick={toggleActions}>
          Familie
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink
          to="/innflytelse"
          icon="handshake-simple"
          onClick={toggleActions}
        >
          Innflytelse
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink
          to="/kriminalitet"
          icon="money-bill"
          onClick={toggleActions}
        >
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

        <SidebarLink to="/biltyveri" icon="car" onClick={toggleActions}>
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

        <SidebarLink to="/ran" icon="sack-dollar" onClick={toggleActions}>
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

        <SidebarLink to="/drep" icon="gun" onClick={toggleActions}>
          Drep spiller
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="/fengsel" icon="handcuffs" onClick={toggleActions}>
          Fengsel
        </SidebarLink>

        <SidebarLink
          to="/parkering"
          icon="square-parking"
          onClick={toggleActions}
        >
          Parkering
        </SidebarLink>

        <SidebarLink to="/flyplass" icon="plane" onClick={toggleActions}>
          Flyplass
        </SidebarLink>

        <hr className="border-neutral-600" />

        <SidebarLink to="/jackpot" icon="7" onClick={toggleActions}>
          Jackpot
        </SidebarLink>
      </nav>
    )
  );
};

export default DropdownLeft;
