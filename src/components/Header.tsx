// Files
import logo from "../assets/DsD3.png";

// Context
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";
import { useMenuContext } from "../MenuContext";
import { useMusicContext } from "../MusicContext";
import { useCooldown } from "../CooldownContext";
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

const Header = () => {
  const { character } = useCharacter();
  const { userData } = useAuth();
  const { cooldowns, fetchCooldown } = useCooldown();
  const { toggleActions, menuOpen, toggleMenu } = useMenuContext();
  const { playing, setPlaying, volume, setVolume, audioElement } =
    useMusicContext();
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

  // Fetch cooldowns
  useEffect(() => {
    if (!userData) return;
    if (userData.activeCharacter && cooldowns["crime"] === undefined) {
      // Fetch cooldown only if it hasn't been fetched yet
      fetchCooldown("crime", 90, userData.activeCharacter);
    }
    if (userData.activeCharacter && cooldowns["gta"] === undefined) {
      fetchCooldown("gta", 130, userData.activeCharacter);
    }
    if (userData.activeCharacter && cooldowns["robbery"] === undefined) {
      fetchCooldown("robbery", 150, userData.activeCharacter);
    }
  }, [userData, cooldowns, fetchCooldown]);

  // Function to toggle music
  const toggleMusic = () => {
    if (!audioElement.src) {
      console.error("No audio source provided.");
      return;
    }
    if (playing) {
      audioElement.pause(); // Pause immediately
      setTimeout(() => setPlaying(false), 50); // Delay state update slightly
    } else {
      setPlaying(true);
      setTimeout(() => {
        audioElement
          .play()
          .catch((err) => console.error("Audio playback error:", err));
      }, 50); // Delay audio playback slightly
    }
  };

  // Update the volume in the audio element
  useEffect(() => {
    audioElement.volume = volume; // Sync volume state with audio element
  }, [volume, audioElement]);

  return (
    <header className="h-16 sm:h-20 bg-neutral-950 px-2 sm:px-8 py-2 sm:py-4 flex justify-between items-center border-b border-neutral-700">
      {/* Actions menu icon for small screens */}
      <button
        className="actions-button flex justify-center items-center rounded-md sm:hidden w-12 h-12 bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer"
        onClick={toggleActions}
      >
        <i className="text-3xl fa-solid fa-location-crosshairs pointer-events-none"></i>
      </button>

      {/* Logo */}
      <div className="hidden sm:flex">
        <Link to="/">
          <img className="h-16" src={logo} alt="Den siste Don Logo" />
        </Link>
      </div>

      {/* Music panel */}
      <div className="flex flex-col gap-1 items-center">
        {/* Toggle playing button */}
        <button
          className="cursor-pointer w-10 text-stone-400 hover:text-stone-200"
          onClick={toggleMusic}
        >
          {playing ? (
            <i className="fa-solid fa-pause"></i>
          ) : (
            <i className="fa-solid fa-play"></i>
          )}
        </button>
        {/* Volume slider */}
        <div className="flex items-center gap-1 bg-neutral-800 py-1 px-2 rounded-full">
          <i className="fa-solid fa-volume-down text-stone-400"></i>
          <input
            className="w-24 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer focus:outline-none"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={
              {
                "--thumb-color": "#999999", // Custom color for thumb
              } as React.CSSProperties
            }
          />
          <i className="fa-solid fa-volume-up text-stone-400"></i>

          <style>
            {`
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      background-color: var(--thumb-color); /* Custom thumb color */
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
    }
    input[type="range"]::-moz-range-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      background-color: var(--thumb-color); /* Custom thumb color for Firefox */
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
    }
  `}
          </style>
        </div>
      </div>

      {/* Menu button */}
      <button
        className={`menu-button relative flex justify-center items-center rounded-md w-12 h-12 bg-neutral-800 hover:bg-neutral-700 cursor-pointer ${
          menuOpen ? "bg-neutral-700" : "bg-neutral-800"
        }`}
        onClick={toggleMenu}
      >
        <i className="text-3xl fa-solid fa-bars pointer-events-none"></i>
        {unreadAlertCount > 0 && (
          <span className="absolute top-0 right-0 bg-yellow-400 -translate-y-1 translate-x-1 text-neutral-900 text-xs font-bold rounded-full w-4 h-4 flex justify-center items-center">
            {unreadAlertCount}
          </span>
        )}
      </button>
    </header>
  );
};

export default Header;
