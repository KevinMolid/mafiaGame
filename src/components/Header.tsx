import logo from "../assets/DsD3.png";

import { useMenuContext } from "../MenuContext";

// React
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Firebase
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
import { useCharacter } from "../CharacterContext";

const Header = () => {
  const { character } = useCharacter();
  const { toggleActions, toggleMenu } = useMenuContext();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  useEffect(() => {
    if (!character || !character.id) return;

    const alertsRef = collection(db, "Characters", character.id, "alerts");
    const alertsQuery = query(alertsRef, where("read", "==", false)); // Query only unread alerts

    // Real-time listener for unread alerts
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const unreadCount = snapshot.docs.length; // Count the number of unread alerts
      setUnreadAlertCount(unreadCount); // Set the state with the count
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [character]);

  return (
    <header className="bg-neutral-950 px-2 sm:px-8 py-2 sm:py-4 flex justify-between items-center">
      {/* Actions menu icon for small screens */}
      <div
        className="flex justify-center items-center rounded-md sm:hidden w-12 h-12 bg-neutral-700 hover:cursor-pointer"
        onClick={toggleActions}
      >
        <i className="text-3xl fa-solid fa-location-crosshairs"></i>
      </div>

      {/* Logo */}
      <Link to="/">
        <img
          className="h-14 sm:h-16"
          src={logo}
          alt="MafiaReign Logo: Fight for Dominance"
        />
      </Link>

      {/* Menu icon for small screens */}
      <div
        className="flex justify-center items-center rounded-md w-12 h-12 bg-neutral-700 cursor-pointer"
        onClick={toggleMenu}
      >
        {unreadAlertCount > 0 && (
          <i className="text-3xl text-yellow-400 fa-regular fa-bell fa-shake"></i>
        )}
        {unreadAlertCount <= 0 && <i className="text-3xl fa-solid fa-bars"></i>}
      </div>
    </header>
  );
};

export default Header;
