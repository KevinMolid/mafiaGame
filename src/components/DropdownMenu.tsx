import SidebarLink from "./SidebarLink";

interface DropdownInterface {
  linkOnClick?: () => void;
}

const DropdownMenu = ({ linkOnClick }: DropdownInterface) => {
  return (
    <nav className="flex flex-col gap-2 bg-neutral-950 p-4 sm:hidden min-w-40 select-none">
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
        Street crime
      </SidebarLink>

      <SidebarLink to="gta" icon="car" onClick={linkOnClick}>
        Grand Theft Auto
      </SidebarLink>

      <SidebarLink to="robbery" icon="sack-dollar" onClick={linkOnClick}>
        Robbery
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
