// Files
import logo from "../assets/DsDsmall.png";

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
  const { userCharacter } = useCharacter();
  const { userData } = useAuth();
  const { cooldowns, fetchCooldown } = useCooldown();
  const { toggleActions, menuOpen, toggleMenu } = useMenuContext();
  const { playing, setPlaying, volume, setVolume, audioElement } =
    useMusicContext();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!userCharacter || !userCharacter.id) return;

    const alertsRef = collection(db, "Characters", userCharacter.id, "alerts");
    const alertsQuery = query(alertsRef, where("read", "==", false)); // Query only unread alerts

    // Real-time listener for unread alerts
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const unreadCount = snapshot.docs.length; // Count the number of unread alerts
      setUnreadAlertCount(unreadCount); // Set the state with the count
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [userCharacter]);

  // Unread messages across all conversations
  useEffect(() => {
    if (!userCharacter?.username || !userCharacter?.id) return;

    // 1) Listen to conversations the user participates in
    const convQ = query(
      collection(db, "Conversations"),
      where("participants", "array-contains", userCharacter.username)
    );

    // Keep track of per-conversation unread counts and message unsubscribers
    const perConvCounts: Record<string, number> = {};
    const msgUnsubs = new Map<string, () => void>();

    const unsubConvs = onSnapshot(
      convQ,
      (convSnap) => {
        // Clean up listeners that no longer exist
        const currentIds = new Set(convSnap.docs.map((d) => d.id));
        for (const [convId, unsub] of msgUnsubs) {
          if (!currentIds.has(convId)) {
            unsub();
            msgUnsubs.delete(convId);
            delete perConvCounts[convId];
          }
        }

        // Ensure there is a listener per conversation
        convSnap.docs.forEach((convDoc) => {
          const convId = convDoc.id;
          if (msgUnsubs.has(convId)) return;

          // 2) For each conversation, listen to unread messages (isRead == false)
          // We’ll filter out our own sent messages on the client.
          const msgQ = query(
            collection(db, "Conversations", convId, "Messages"),
            where("isRead", "==", false)
          );

          const unsub = onSnapshot(
            msgQ,
            (msgSnap) => {
              // Count only incoming unread messages
              const cnt = msgSnap.docs.reduce((acc, d) => {
                const data = d.data() as any;
                return data.senderId !== userCharacter.id ? acc + 1 : acc;
              }, 0);
              perConvCounts[convId] = cnt;
              // Sum all convs
              const total = Object.values(perConvCounts).reduce(
                (a, b) => a + b,
                0
              );
              setUnreadMessageCount(total);
            },
            (err) => {
              console.error("Messages listener error:", err);
              perConvCounts[convId] = 0;
              const total = Object.values(perConvCounts).reduce(
                (a, b) => a + b,
                0
              );
              setUnreadMessageCount(total);
            }
          );

          msgUnsubs.set(convId, unsub);
        });
      },
      (err) => {
        console.error("Conversations listener error:", err);
        // On error, clear counts
        for (const [, unsub] of msgUnsubs) unsub();
        msgUnsubs.clear();
        setUnreadMessageCount(0);
      }
    );

    // Cleanup everything on unmount/user change
    return () => {
      unsubConvs();
      for (const [, unsub] of msgUnsubs) unsub();
      msgUnsubs.clear();
    };
  }, [userCharacter?.username, userCharacter?.id]);

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
    <header className="h-16 sm:h-20 bg-neutral-950 border-b border-neutral-700 flex flex-col items-center">
      {/* Container */}
      <div className="h-16 sm:h-20 px-2 sm:px-8 py-2 sm:py-4 flex justify-between items-center w-full max-w-[1440px]">
        {/* Actions menu icon for small screens */}
        <button
          className="actions-button flex justify-center items-center rounded-md lg:hidden w-12 h-12 bg-neutral-800 hover:bg-neutral-700 hover:cursor-pointer"
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
        <div
          className={`lg:w-[162px] flex justify-end ${
            userData ? "xl:hidden" : ""
          }`}
        >
          <button
            className={`menu-button relative flex justify-center items-center rounded-md w-12 h-12 bg-neutral-800 hover:bg-neutral-700 cursor-pointer ${
              menuOpen ? "bg-neutral-700 " : "bg-neutral-800 "
            } ${userData ? "xl:hidden" : ""}`}
            onClick={toggleMenu}
          >
            <i className="text-3xl fa-solid fa-bars pointer-events-none"></i>
            {/* Unread alerts (top-right, yellow) */}
            {unreadAlertCount > 0 && (
              <span className="absolute top-0 right-0 bg-neutral-600 -translate-y-1 translate-x-1 text-yellow-400 text-s font-bold rounded-full w-5 h-5 flex justify-center items-center">
                {unreadAlertCount}
              </span>
            )}

            {/* Unread messages (bottom-right, sky-400) */}
            {unreadMessageCount > 0 && (
              <span className="absolute bottom-0 right-0 bg-neutral-600 translate-x-1 translate-y-1 text-sky-400 text-s font-bold rounded-full w-5 h-5 flex justify-center items-center">
                {unreadMessageCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
