import logo from "../assets/LogoV2.png";

// React
import { Link } from "react-router-dom";
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
  const actionsRef = useRef<HTMLDivElement | null>(null);

  // Sign out
  function logOut() {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
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
        menuOpen
      ) {
        setMenuOpen(false); // Close menu if clicking outside
      }
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node) &&
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
      {/* Menu icon for small screens */}
      <div
        className="flex justify-center items-center rounded-md sm:hidden w-12 h-12 bg-neutral-700 hover:cursor-pointer"
        onClick={toggleActions}
      >
        <i className="text-3xl fa-solid fa-location-crosshairs"></i>
      </div>

      {/* Small screen Action dropdown menu */}
      {actionsOpen && (
        <nav
          ref={actionsRef}
          className="absolute top-16 left-0 bg-neutral-950 p-4 sm:hidden z-10 min-w-40"
        >
          <p>Actions</p>
          <hr className="border-neutral-500 mb-2" />
          <ul className="flex flex-col gap-2 text-stone-400">
            <li className="hover:text-stone-200">
              <Link to="/influence" onClick={() => setActionsOpen(false)}>
                <i className="fa-solid fa-handshake-simple"></i> Influence
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/streetcrime" onClick={() => setActionsOpen(false)}>
                <i className="fa-solid fa-money-bill"></i> Street Crimes
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/parking" onClick={() => setActionsOpen(false)}>
                <i className="fa-solid fa-square-parking"></i> Parking
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/prison" onClick={() => setActionsOpen(false)}>
                <i className="fa-solid fa-handcuffs"></i> Prison
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/travel" onClick={() => setActionsOpen(false)}>
                <i className="fa-solid fa-plane"></i> Travel
              </Link>
            </li>
          </ul>
        </nav>
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
        className="flex justify-center items-center rounded-md sm:hidden w-12 h-12 bg-neutral-700 hover:cursor-pointer"
        onClick={toggleMenu}
      >
        <i className="text-3xl fa-solid fa-bars"></i>
      </div>

      {/* Small screen dropdown menu */}
      {menuOpen && (
        <nav
          ref={menuRef}
          className="absolute top-16 right-0 bg-neutral-950 p-4 sm:hidden z-10"
        >
          <p>Menu</p>
          <hr className="border-neutral-500 mb-2" />
          <ul className="flex flex-col gap-2 text-stone-400">
            <li className="hover:text-stone-200">
              <Link to="/about" onClick={() => setMenuOpen(false)}>
                <i className="fa-solid fa-circle-info"></i> About
              </Link>
            </li>
            <Link to="/chat" onClick={() => setMenuOpen(false)}>
              <h2 className="hover:text-stone-200">
                <i className="fa-solid fa-comment-dots"></i> Chat
              </h2>
            </Link>
            <li className="hover:text-stone-200">
              <Link to="/forum" onClick={() => setMenuOpen(false)}>
                <i className="fa-solid fa-comments"></i> Forum
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>
                <i className="fa-solid fa-medal"></i> Leaderboard
              </Link>
            </li>
            {userData ? (
              <li className="hover:text-stone-200">
                <button
                  onClick={() => {
                    logOut();
                    setMenuOpen(false);
                  }}
                >
                  Log out
                </button>
              </li>
            ) : (
              <li className="hover:text-stone-200">
                <Link to="/signup" onClick={() => setMenuOpen(false)}>
                  Log in / Sign up
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}

      {/* Normal navigation menu for larger screens */}
      <nav className="hidden sm:flex">
        <ul className="gap-6 flex">
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
