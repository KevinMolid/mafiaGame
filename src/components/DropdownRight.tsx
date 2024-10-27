import SidebarLink from "./SidebarLink";

import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

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
      <nav className="absolute z-30 top-0 right-0 flex flex-col gap-2 bg-neutral-950 p-4 min-w-56 select-none border-l border-neutral-500 h-full">
        <p>Meny</p>
        <hr className="border-neutral-500" />

        {userData?.type === "/admin" && (
          <SidebarLink to="admin" icon="gear" onClick={toggleMenu}>
            Admin
          </SidebarLink>
        )}

        {!hasUnreadAlerts && (
          <SidebarLink to="/varsler" icon="bell" onClick={toggleMenu}>
            Varsler
          </SidebarLink>
        )}

        {hasUnreadAlerts && (
          <SidebarLink
            to="/varsler"
            icon="bell fa-shake text-yellow-400"
            onClick={toggleMenu}
          >
            <p className="text-yellow-400">Varsler</p>
            <p>{unreadAlertCount}</p>
          </SidebarLink>
        )}

        <SidebarLink to="/spillguide" icon="circle-info" onClick={toggleMenu}>
          Spillguide
        </SidebarLink>

        <SidebarLink to="/meldinger" icon="comment-dots" onClick={toggleMenu}>
          Meldinger
        </SidebarLink>

        <SidebarLink to="/forum" icon="comments" onClick={toggleMenu}>
          Forum
        </SidebarLink>

        <SidebarLink to="/toppliste" icon="medal" onClick={toggleMenu}>
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
                closeMenus();
              }}
            >
              Logg ut
            </button>
          </div>
        )}

        {!userData && (
          <div className="text-stone-400 hover:text-stone-200">
            <Link to="/signup" onClick={() => closeMenus()}>
              Logg inn / Registrer bruker
            </Link>
          </div>
        )}
      </nav>
    )
  );
};

export default DropdownRight;
