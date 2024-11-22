import DropdownOption from "./DropdownOption";

import { useRef, useEffect } from "react";
import { useCooldown } from "../CooldownContext";
import { useMenuContext } from "../MenuContext";

const DropdownLeft = () => {
  const { actionsOpen, toggleActions, closeMenus } = useMenuContext();
  const { cooldowns } = useCooldown();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        actionsOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        closeMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionsOpen, closeMenus]);

  return (
    <div
      className={`absolute z-30 top-16 sm:top-20 right-0 w-full h-full transition-opacity duration-300 ease-in-out ${
        actionsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      } bg-black/50`}
    >
      {" "}
      <nav
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute z-30 top-0 left-0 flex flex-col bg-neutral-800 min-w-56 select-none h-full min-h-[max-content] pb-12 shadow-2xl"
      >
        <div className="p-2"></div>

        <DropdownOption to="/" icon="house" onClick={toggleActions}>
          Hovedkvarter
        </DropdownOption>

        <DropdownOption to="butikk" icon="shop" onClick={toggleActions}>
          Butikk
        </DropdownOption>

        <DropdownOption to="/bank" icon="landmark" onClick={toggleActions}>
          Bank
        </DropdownOption>

        <hr className="border-neutral-700 my-2 sm:hidden" />

        <DropdownOption to="/familie" icon="users" onClick={toggleActions}>
          Familie
        </DropdownOption>

        <hr className="border-neutral-700 my-2 sm:hidden" />

        <DropdownOption
          to="/innflytelse"
          icon="handshake-simple"
          onClick={toggleActions}
        >
          Innflytelse
        </DropdownOption>

        <hr className="border-neutral-700 my-2 sm:hidden" />

        <DropdownOption
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
        </DropdownOption>

        <DropdownOption to="/biltyveri" icon="car" onClick={toggleActions}>
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
        </DropdownOption>

        <DropdownOption to="/ran" icon="sack-dollar" onClick={toggleActions}>
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
        </DropdownOption>

        <DropdownOption to="/drep" icon="gun" onClick={toggleActions}>
          Drep spiller
        </DropdownOption>

        <hr className="border-neutral-700 my-2 sm:hidden" />

        <DropdownOption to="streetracing" icon="flag-checkered">
          Streetracing
        </DropdownOption>

        <hr className="border-neutral-700 my-2 sm:hidden" />

        <DropdownOption to="/fengsel" icon="handcuffs" onClick={toggleActions}>
          Fengsel
        </DropdownOption>

        <DropdownOption
          to="/parkering"
          icon="square-parking"
          onClick={toggleActions}
        >
          Parkering
        </DropdownOption>

        <DropdownOption to="/flyplass" icon="plane" onClick={toggleActions}>
          Flyplass
        </DropdownOption>

        <hr className="border-neutral-700 my-2 sm:hidden" />

        <DropdownOption to="/jackpot" icon="7" onClick={toggleActions}>
          Jackpot
        </DropdownOption>
      </nav>
    </div>
  );
};

export default DropdownLeft;
