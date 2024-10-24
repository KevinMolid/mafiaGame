import SidebarLink from "./SidebarLink";

import { useCooldown } from "../CooldownContext";

interface DropdownInterface {
  linkOnClick?: () => void;
}

const DropdownMenu = ({ linkOnClick }: DropdownInterface) => {
  const { cooldowns } = useCooldown();

  return (
    <nav className="flex flex-col gap-2 bg-neutral-950 p-4 sm:hidden min-w-56 select-none">
      <p>Handlinger</p>
      <hr className="border-neutral-500" />

      <SidebarLink to="/" icon="house" onClick={linkOnClick}>
        Hovedkvarter
      </SidebarLink>

      <SidebarLink to="bank" icon="landmark" onClick={linkOnClick}>
        Bank
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="familie" icon="users" onClick={linkOnClick}>
        Familie
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink
        to="innflytelse"
        icon="handshake-simple"
        onClick={linkOnClick}
      >
        Innflytelse
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="kriminalitet" icon="money-bill" onClick={linkOnClick}>
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

      <SidebarLink to="biltyveri" icon="car" onClick={linkOnClick}>
        <div>Biltyveri</div>
        {cooldowns["gta"] > 0 ? (
          <div className="text-neutral-200 font-medium">{cooldowns["gta"]}</div>
        ) : (
          <div className="text-green-400">
            <i className="fa-solid fa-check"></i>
          </div>
        )}
      </SidebarLink>

      <SidebarLink to="ran" icon="sack-dollar" onClick={linkOnClick}>
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

      <SidebarLink to="drep" icon="gun" onClick={linkOnClick}>
        Drep spiller
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="fengsel" icon="handcuffs" onClick={linkOnClick}>
        Fengsel
      </SidebarLink>

      <SidebarLink to="parkering" icon="square-parking" onClick={linkOnClick}>
        Parkering
      </SidebarLink>

      <SidebarLink to="flyplass" icon="plane" onClick={linkOnClick}>
        Flyplass
      </SidebarLink>
    </nav>
  );
};

export default DropdownMenu;
