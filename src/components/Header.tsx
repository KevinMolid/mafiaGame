import logo from "../assets/LogoV2.png";

// React
import { Link } from "react-router-dom";
import { useState } from "react";

// Firebase
import { getAuth, signOut } from "firebase/auth";

// Context
import { useAuth } from "../AuthContext";

const Header = () => {
  const { userData } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = getAuth();

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
  };

  return (
    <header className="bg-neutral-950 px-4 sm:px-8 py-4 flex justify-between items-center">
      <Link to="/">
        <img
          className="h-14"
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
        <nav className="absolute top-16 right-8 bg-neutral-950 p-4 rounded-md sm:hidden z-10">
          <ul className="flex flex-col gap-4 text-stone-400">
            <li className="hover:text-stone-200">
              <Link to="/about" onClick={() => setMenuOpen(false)}>
                About
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/forum" onClick={() => setMenuOpen(false)}>
                Forum
              </Link>
            </li>
            <li className="hover:text-stone-200">
              <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>
                Leaderboard
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
