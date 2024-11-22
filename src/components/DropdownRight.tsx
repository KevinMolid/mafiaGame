// Components
import DropdownOption from "./DropdownOption";
import Username from "./Typography/Username";

// React
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Functions
import { getCurrentRank } from "../Functions/RankFunctions";

// Context
import { useCharacter } from "../CharacterContext";
import { useMenuContext } from "../MenuContext";
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
  const { menuOpen, toggleMenu, closeMenus } = useMenuContext();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  // Create a ref for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
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

  return (
    menuOpen && (
      <nav
        ref={dropdownRef}
        className="absolute z-30 top-0 right-0 flex flex-col bg-neutral-950 min-w-56 select-none h-full border-l border-neutral-700 shadow-2xl"
      >
        {character ? (
          <div>
            <div className="p-4 pb-2 flex sm:hidden gap-2 items-center">
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
            <hr className="border-neutral-700 my-2 sm:hidden" />
            <div className="hidden sm:flex p-2"></div>
          </div>
        ) : (
          <div className="p-2"></div>
        )}

        {userData?.type === "admin" && (
          <>
            <DropdownOption
              to="/admin"
              icon="gears"
              onClick={toggleMenu}
              color="yellow"
            >
              <p>Kontrollpanel</p>
            </DropdownOption>
            <hr className="border-neutral-700 my-2" />
          </>
        )}

        {userData && !hasUnreadAlerts && (
          <DropdownOption to="/varsler" icon="bell" onClick={toggleMenu}>
            Varsler
          </DropdownOption>
        )}

        {userData && hasUnreadAlerts && (
          <DropdownOption
            to="/varsler"
            icon="bell fa-shake text-yellow-400"
            onClick={toggleMenu}
            color="yellow"
          >
            <p>Varsler</p>
            <p>{unreadAlertCount}</p>
          </DropdownOption>
        )}

        {userData && (
          <DropdownOption
            to="/meldinger"
            icon="comment-dots"
            onClick={toggleMenu}
          >
            Meldinger
          </DropdownOption>
        )}

        {userData && (
          <DropdownOption to="/forum" icon="comments" onClick={toggleMenu}>
            Forum
          </DropdownOption>
        )}

        <DropdownOption to="/toppliste" icon="trophy" onClick={toggleMenu}>
          Toppliste
        </DropdownOption>

        <DropdownOption
          to="/statistikk"
          icon="chart-simple"
          onClick={toggleMenu}
        >
          Statistikk
        </DropdownOption>

        <DropdownOption
          to="/spillguide"
          icon="circle-info"
          onClick={toggleMenu}
        >
          Spillguide
        </DropdownOption>

        <hr className="border-neutral-700 my-2" />

        {userData && (
          <DropdownOption
            icon="right-from-bracket"
            onClick={() => {
              logOut();
              closeMenus();
            }}
          >
            <p>Logg ut</p>
          </DropdownOption>
        )}

        {!userData && (
          <DropdownOption
            to="/logginn"
            icon="right-to-bracket"
            onClick={toggleMenu}
          >
            Logg inn
          </DropdownOption>
        )}
      </nav>
    )
  );
};

export default DropdownRight;
