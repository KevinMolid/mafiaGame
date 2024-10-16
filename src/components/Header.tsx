import logo from "../assets/LogoV2.png";
import SidebarLink from "./SidebarLink";
import DropdownMenu from "./DropdownMenu";

// React
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Firebase
import { getAuth, signOut } from "firebase/auth";

// Context
import { useAuth } from "../AuthContext";

const Header = () => {
  const { userData } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const auth = getAuth();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const actionsButtonRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  // Sign out
  function logOut() {
    signOut(auth)
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.log(error.message);
      });
  }

  // Toggle the menu open/close state
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setActionsOpen(false);
  };

  // Toggle the menu open/close state
  const toggleActions = () => {
    setActionsOpen(!actionsOpen);
    setMenuOpen(false);
  };

  // Close menus if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node) &&
        menuOpen
      ) {
        setMenuOpen(false); // Close menu if clicking outside
      }
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node) &&
        actionsButtonRef.current &&
        !actionsButtonRef.current.contains(event.target as Node) &&
        actionsOpen
      ) {
        setActionsOpen(false); // Close actions menu if clicking outside
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, actionsOpen]); // Listen only when menus are open

  return (
    <header className="bg-neutral-950 px-2 sm:px-8 py-2 sm:py-4 flex justify-between items-center">
      {/* Actions menu icon for small screens */}
      <div
        ref={actionsButtonRef}
        className="flex justify-center items-center rounded-md sm:hidden w-12 h-12 bg-neutral-700 hover:cursor-pointer"
        onClick={toggleActions}
      >
        <i className="text-3xl fa-solid fa-location-crosshairs"></i>
      </div>

      {/* Small screen Action dropdown menu */}
      {actionsOpen && (
        <div className={"absolute top-16 left-0 z-40"} ref={actionsRef}>
          <DropdownMenu linkOnClick={() => setActionsOpen(false)} />
        </div>
      )}

      {/* Logo */}
      <Link to="/">
        <img
          className="h-12 sm:h-14"
          src={logo}
          alt="MafiaReign Logo: Fight for Dominance"
        />
      </Link>

      {/* Menu icon for small screens */}
      <div
        ref={menuButtonRef}
        className="flex justify-center items-center rounded-md sm:hidden w-12 h-12 bg-neutral-700 hover:cursor-pointer"
        onClick={toggleMenu}
      >
        <i className="text-3xl fa-solid fa-bars"></i>
      </div>

      {/* Small screen dropdown menu */}
      {menuOpen && (
        <nav
          ref={menuRef}
          className="absolute flex flex-col gap-2 top-16 right-0 bg-neutral-950 p-4 sm:hidden z-10 min-w-40 select-none"
        >
          <p>Menu</p>
          <hr className="border-neutral-500" />

          {userData?.type === "admin" && (
            <SidebarLink
              to="admin"
              icon="gear"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </SidebarLink>
          )}

          <SidebarLink
            to="about"
            icon="circle-info"
            onClick={() => setMenuOpen(false)}
          >
            About
          </SidebarLink>

          <SidebarLink
            to="forum"
            icon="comments"
            onClick={() => setMenuOpen(false)}
          >
            Forum
          </SidebarLink>

          <SidebarLink
            to="leaderboard"
            icon="medal"
            onClick={() => setMenuOpen(false)}
          >
            Leaderboard
          </SidebarLink>

          {userData && (
            <div className="text-stone-400 hover:text-stone-200">
              <button
                onClick={() => {
                  logOut();
                  setMenuOpen(false);
                }}
              >
                Log out
              </button>
            </div>
          )}

          {!userData && (
            <div className="text-stone-400 hover:text-stone-200">
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                Log in / Sign up
              </Link>
            </div>
          )}
        </nav>
      )}

      {/* Normal navigation menu for larger screens */}
      <nav className="hidden sm:flex">
        <ul className="gap-6 flex">
          <li className="text-yellow-400 hover:text-yellow-200">
            {userData?.type === "admin" && (
              <Link to="/admin">
                <i className="fa-solid fa-gear"></i> Admin
              </Link>
            )}
          </li>
          <li className="text-stone-400 hover:text-stone-200">
            <Link to="/about">About</Link>
          </li>
          <li className="text-stone-400 hover:text-stone-200">
            <Link to="/forum">Forum</Link>
          </li>
          <li className="text-stone-400 hover:text-stone-200">
            <Link to="/leaderboard">Leaderboard</Link>
          </li>
          {userData ? (
            <li className="text-stone-400 hover:text-stone-200">
              <button onClick={logOut}>Log out</button>
            </li>
          ) : (
            <li className="text-stone-400 hover:text-stone-200">
              <Link to="/signup">Log in / Sign up</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
