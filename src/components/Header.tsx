import logo from "../assets/DsD3.png";

import { useMenuContext } from "../MenuContext";
import { useMusicContext } from "../MusicContext";

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

      {/* Music panel */}
      <div className="flex flex-col gap-1 items-center">
        {/* Toggle playing button */}
        <div
          className="cursor-pointer text-stone-400 hover:text-stone-200"
          onClick={toggleMusic}
        >
          {playing ? (
            <i className="fa-solid fa-pause"></i>
          ) : (
            <i className="fa-solid fa-play"></i>
          )}
        </div>
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

      {/* Menu icon */}
      <div
        className="relative flex justify-center items-center rounded-md w-12 h-12 bg-neutral-700 cursor-pointer"
        onClick={toggleMenu}
      >
        <i className="text-3xl fa-solid fa-bars"></i>
        {unreadAlertCount > 0 && (
          <span className="absolute top-0 right-0 bg-yellow-400 -translate-y-1 translate-x-1 text-neutral-900 text-xs font-bold rounded-full w-4 h-4 flex justify-center items-center">
            {unreadAlertCount}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
