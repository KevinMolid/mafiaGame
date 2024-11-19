// Components
import SidebarLink from "./SidebarLink";
import Username from "./Typography/Username";

// React
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Functions
import { getCurrentRank } from "../Functions/RankFunctions";

// Context
import AudioPlay from "./Audio";
import { useCharacter } from "../CharacterContext";
import { useMenuContext } from "../MenuContext";
import { useMusicContext } from "../MusicContext";
import { useAuth } from "../AuthContext";

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

const DropdownRight = () => {
  const { userData } = useAuth();
  const { character } = useCharacter();
  const { playing, setPlaying } = useMusicContext();
  const { menuOpen, toggleMenu, closeMenus } = useMenuContext();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  // Create a ref for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        toggleMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggleMenu]);

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

  // Toggle Music player
  const toggleMusic = () => {
    if (playing) {
      setPlaying(0);
    } else {
      setPlaying(1);
    }
  };

  return (
    menuOpen && (
      <nav
        ref={dropdownRef}
        className="absolute z-30 top-0 right-0 flex flex-col gap-2 bg-neutral-950 p-4 min-w-56 select-none border-l border-neutral-500 h-full"
      >
        {character && (
          <div className="mb-2 flex sm:hidden gap-2 items-center">
            <Link to={`/profil/${character.id}`}>
              <img
                className="border border-neutral-500 w-[60px] h-[60px] object-cover hover:cursor-pointer"
                src={character.img || "/default.jpg"}
                alt="Profile picture"
              />
            </Link>
            <div className="text-stone-400">
              <Username character={character} />
              <p>{getCurrentRank(character.stats.xp)}</p>
            </div>
          </div>
        )}

        <p>Meny</p>
        <hr className="border-neutral-500" />

        {userData?.type === "admin" && (
          <SidebarLink
            to="/admin"
            icon="gears"
            onClick={toggleMenu}
            color="yellow"
          >
            <p className="text-white font-medium">Kontrollpanel</p>
          </SidebarLink>
        )}

        {userData && !hasUnreadAlerts && (
          <SidebarLink to="/varsler" icon="bell" onClick={toggleMenu}>
            Varsler
          </SidebarLink>
        )}

        {userData && hasUnreadAlerts && (
          <SidebarLink
            to="/varsler"
            icon="bell fa-shake text-yellow-400"
            onClick={toggleMenu}
            color="yellow"
          >
            <p>Varsler</p>
            <p>{unreadAlertCount}</p>
          </SidebarLink>
        )}

        {userData && (
          <SidebarLink to="/meldinger" icon="comment-dots" onClick={toggleMenu}>
            Meldinger
          </SidebarLink>
        )}

        {userData && (
          <SidebarLink to="/forum" icon="comments" onClick={toggleMenu}>
            Forum
          </SidebarLink>
        )}

        <SidebarLink to="/toppliste" icon="trophy" onClick={toggleMenu}>
          Toppliste
        </SidebarLink>

        <SidebarLink to="/statistikk" icon="chart-simple" onClick={toggleMenu}>
          Statistikk
        </SidebarLink>

        <SidebarLink to="/spillguide" icon="circle-info" onClick={toggleMenu}>
          Spillguide
        </SidebarLink>

        {/* Music */}
        <AudioPlay
          playing={playing}
          loop={true}
          audio="MafiaReign.wav"
        ></AudioPlay>

        {/* Music panel */}
        {userData && (
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
        )}

        {userData && (
          <div
            className="text-stone-400 hover:text-stone-200 grid grid-cols-[24px_auto] cursor-pointer"
            onClick={() => {
              logOut();
              closeMenus();
            }}
          >
            <div>
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            <p>Logg ut</p>
          </div>
        )}

        {!userData && (
          <SidebarLink
            to="/logginn"
            icon="right-to-bracket"
            onClick={toggleMenu}
          >
            Logg inn
          </SidebarLink>
        )}
      </nav>
    )
  );
};

export default DropdownRight;
