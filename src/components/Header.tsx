import logo from "../assets/LogoV2.png";
import SidebarLink from "./SidebarLink";
import DropdownMenu from "./DropdownMenu";

import AudioPlay from "./Audio";

// React
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Firebase
import { getAuth, signOut } from "firebase/auth";
import {
  getFirestore,
  onSnapshot,
  query,
  where,
  collection,
} from "firebase/firestore";

// Initialize Firebase Firestore
const db = getFirestore();

// Context
import { useAuth } from "../AuthContext";
import { useMusicContext } from "../MusicContext";
import { useCharacter } from "../CharacterContext";

const Header = () => {
  const { userData } = useAuth();
  const { character } = useCharacter();
  const { playing, setPlaying } = useMusicContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
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
        navigate("/logginn");
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

  // Toggle Music player
  const toggleMusic = () => {
    if (playing) {
      setPlaying(0);
    } else {
      setPlaying(1);
    }
  };

  useEffect(() => {
    if (!character || !character.id) return;

    const alertsRef = collection(db, "Characters", character.id, "alerts");
    const alertsQuery = query(alertsRef, where("read", "==", false)); // Query only unread alerts

    // Real-time listener for unread alerts
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const unreadCount = snapshot.docs.length; // Count the number of unread alerts
      setUnreadAlertCount(unreadCount); // Set the state with the count
      setHasUnreadAlerts(unreadCount > 0); // Determine if there are any unread alerts
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [character]);

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
        className="flex justify-center items-center rounded-md w-12 h-12 bg-neutral-700 cursor-pointer"
        onClick={toggleMenu}
      >
        {hasUnreadAlerts && (
          <i className="text-3xl text-yellow-400 fa-regular fa-bell fa-shake"></i>
        )}
        {!hasUnreadAlerts && <i className="text-3xl fa-solid fa-bars"></i>}
      </div>

      {/* Small screen dropdown menu */}
      {menuOpen && (
        <nav
          ref={menuRef}
          className="absolute flex flex-col gap-2 top-16 right-0 bg-neutral-950 p-4 z-10 min-w-40 select-none"
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

          {!hasUnreadAlerts && (
            <SidebarLink
              to="varsler"
              icon="bell"
              onClick={() => setMenuOpen(false)}
            >
              Varsler
            </SidebarLink>
          )}

          {hasUnreadAlerts && (
            <SidebarLink
              to="varsler"
              icon="bell fa-shake text-yellow-400"
              onClick={() => setMenuOpen(false)}
            >
              <p className="text-yellow-400">Varsler</p>
              <p>{unreadAlertCount}</p>
            </SidebarLink>
          )}

          <SidebarLink
            to="spillguide"
            icon="circle-info"
            onClick={() => setMenuOpen(false)}
          >
            Spillguide
          </SidebarLink>

          <SidebarLink
            to="meldinger"
            icon="comment-dots"
            onClick={() => setMenuOpen(false)}
          >
            Meldinger
          </SidebarLink>

          <SidebarLink
            to="forum"
            icon="comments"
            onClick={() => setMenuOpen(false)}
          >
            Forum
          </SidebarLink>

          <SidebarLink
            to="toppliste"
            icon="medal"
            onClick={() => setMenuOpen(false)}
          >
            Toppliste
          </SidebarLink>

          {/* Music */}
          <AudioPlay
            playing={playing}
            loop={true}
            audio="MafiaReign.wav"
          ></AudioPlay>

          {/* Music panel */}
          <div
            className="cursor-pointer text-stone-400 hover:text-stone-200"
            onClick={toggleMusic}
          >
            {playing ? (
              <i className="fa-solid fa-volume-high"></i>
            ) : (
              <i className="fa-solid fa-volume-xmark"></i>
            )}{" "}
            {playing ? "Lyd på" : "Lyd av"}
          </div>

          {userData && (
            <div className="text-stone-400 hover:text-stone-200">
              <button
                onClick={() => {
                  logOut();
                  setMenuOpen(false);
                }}
              >
                Logg ut
              </button>
            </div>
          )}

          {!userData && (
            <div className="text-stone-400 hover:text-stone-200">
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                Logg inn / Registrer bruker
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
