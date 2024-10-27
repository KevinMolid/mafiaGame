// MenuContext.js
import { createContext, useContext, useState } from "react";

interface MenuContextType {
  actionsOpen: boolean;
  toggleActions: () => void;
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenus: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Custom hook for easy access
export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenuContext must be used within a MenuProvider");
  }
  return context;
};

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Toggle the menu open/close state
  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
    setActionsOpen(false);
  };

  // Toggle the actions open/close state
  const toggleActions = () => {
    setActionsOpen((prevState) => !prevState);
    setMenuOpen(false);
  };

  // Close all menus
  const closeMenus = () => {
    setMenuOpen(false);
    setActionsOpen(false);
  };

  return (
    <MenuContext.Provider
      value={{
        menuOpen,
        actionsOpen,
        toggleMenu,
        toggleActions,
        closeMenus,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};
