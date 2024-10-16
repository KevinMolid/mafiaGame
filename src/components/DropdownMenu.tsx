import SidebarLink from "./SidebarLink";

import { useCooldown } from "../CooldownContext";

interface DropdownInterface {
  linkOnClick?: () => void;
}

const DropdownMenu = ({ linkOnClick }: DropdownInterface) => {
  const { cooldowns } = useCooldown();

  return (
    <nav className="flex flex-col gap-2 bg-neutral-950 p-4 sm:hidden min-w-56 select-none">
      <p>Actions</p>
      <hr className="border-neutral-500" />
      <SidebarLink
        to="selectcharacater"
        icon="people-group"
        onClick={linkOnClick}
      >
        Select Character
      </SidebarLink>

      <SidebarLink to="bank" icon="landmark" onClick={linkOnClick}>
        Bank
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="family" icon="users" onClick={linkOnClick}>
        Family
      </SidebarLink>

      <SidebarLink to="chat" icon="comment-dots" onClick={linkOnClick}>
        Chat
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="influence" icon="handshake-simple" onClick={linkOnClick}>
        Influence
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="streetcrime" icon="money-bill" onClick={linkOnClick}>
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

      <SidebarLink to="gta" icon="car" onClick={linkOnClick}>
        <div>Grand Theft Auto</div>
        {cooldowns["gta"] > 0 ? (
          <div className="text-neutral-200 font-medium">{cooldowns["gta"]}</div>
        ) : (
          <div className="text-green-400">
            <i className="fa-solid fa-check"></i>
          </div>
        )}
      </SidebarLink>

      <SidebarLink to="robbery" icon="sack-dollar" onClick={linkOnClick}>
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

      <SidebarLink to="assassinate" icon="gun" onClick={linkOnClick}>
        Assassinate
      </SidebarLink>

      <hr className="border-neutral-600" />

      <SidebarLink to="prison" icon="handcuffs" onClick={linkOnClick}>
        Prison
      </SidebarLink>

      <SidebarLink to="parking" icon="square-parking" onClick={linkOnClick}>
        Parking
      </SidebarLink>

      <SidebarLink to="travel" icon="plane" onClick={linkOnClick}>
        Travel
      </SidebarLink>
    </nav>
  );
};

export default DropdownMenu;
