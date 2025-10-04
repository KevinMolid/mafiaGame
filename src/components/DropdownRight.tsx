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
  const { userCharacter } = useCharacter();
  const { menuOpen, toggleMenu } = useMenuContext();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  // Create a ref for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menuOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !(target as HTMLElement).classList.contains("menu-button")
      ) {
        toggleMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, toggleMenu]);

  useEffect(() => {
    if (!userCharacter || !userCharacter.id) return;

    const alertsRef = collection(db, "Characters", userCharacter.id, "alerts");
    const alertsQuery = query(alertsRef, where("read", "==", false)); // Query only unread alerts

    // Real-time listener for unread alerts
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const unreadCount = snapshot.docs.length; // Count the number of unread alerts
      setUnreadAlertCount(unreadCount); // Set the state with the count
      setHasUnreadAlerts(unreadCount > 0); // Determine if there are any unread alerts
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [userCharacter]);

  useEffect(() => {
    if (!userCharacter?.username || !userCharacter?.id) return;

    // 1) Listen to conversations the user participates in
    const convQ = query(
      collection(db, "Conversations"),
      where("participants", "array-contains", userCharacter.username)
    );

    const perConvCounts: Record<string, number> = {};
    const msgUnsubs = new Map<string, () => void>();

    const unsubConvs = onSnapshot(
      convQ,
      (convSnap) => {
        // remove message listeners for conversations that vanished
        const currentIds = new Set(convSnap.docs.map((d) => d.id));
        for (const [convId, unsub] of msgUnsubs) {
          if (!currentIds.has(convId)) {
            unsub();
            msgUnsubs.delete(convId);
            delete perConvCounts[convId];
          }
        }

        // add listeners for new conversations
        convSnap.docs.forEach((convDoc) => {
          const convId = convDoc.id;
          if (msgUnsubs.has(convId)) return;

          // 2) Listen to unread messages in this conversation
          const msgQ = query(
            collection(db, "Conversations", convId, "Messages"),
            where("isRead", "==", false)
          );

          const unsub = onSnapshot(
            msgQ,
            (msgSnap) => {
              // count only incoming (not sent by me)
              const cnt = msgSnap.docs.reduce((acc, d) => {
                const m = d.data() as any;
                return m.senderId !== userCharacter.id ? acc + 1 : acc;
              }, 0);
              perConvCounts[convId] = cnt;

              const total = Object.values(perConvCounts).reduce(
                (a, b) => a + b,
                0
              );
              setUnreadMessageCount(total);
              setHasUnreadMessages(total > 0);
            },
            (err) => {
              console.error("Unread messages listener error:", err);
              perConvCounts[convId] = 0;
              const total = Object.values(perConvCounts).reduce(
                (a, b) => a + b,
                0
              );
              setUnreadMessageCount(total);
              setHasUnreadMessages(total > 0);
            }
          );

          msgUnsubs.set(convId, unsub);
        });
      },
      (err) => {
        console.error("Conversations listener error:", err);
        for (const [, unsub] of msgUnsubs) unsub();
        msgUnsubs.clear();
        setUnreadMessageCount(0);
        setHasUnreadMessages(false);
      }
    );

    // cleanup
    return () => {
      unsubConvs();
      for (const [, unsub] of msgUnsubs) unsub();
      msgUnsubs.clear();
    };
  }, [userCharacter?.username, userCharacter?.id]);

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
    <div
      className={`fixed inset-x-0 top-16 sm:top-20 bottom-0 z-40
                  transition-opacity duration-300 ease-in-out
                  ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                  bg-black/50`}
    >
      <div className="absolute top-0 right-0 min-w-56 h-full overflow-hidden">
        <nav
          ref={dropdownRef}
          className="absolute z-30 flex top-0 left-0 bottom-0 right-[-17px] flex-col bg-neutral-800 min-w-56 select-none h-screen pb-24 shadow-2xl overflow-y-scroll"
        >
          {userCharacter ? (
            <div>
              <Link to={`/profil/${userCharacter.id}`} onClick={toggleMenu}>
                <div className="px-4 py-2 mt-2 flex sm:hidden gap-2 items-center hover:bg-neutral-900">
                  <img
                    className="border border-neutral-500 w-[60px] h-[60px] object-cover hover:cursor-pointer"
                    src={userCharacter.img || "/default.jpg"}
                    alt="Profile picture"
                  />
                  <div className="text-stone-400">
                    <Username
                      character={{
                        id: userCharacter.id,
                        username: userCharacter.username,
                      }}
                    />
                    <p>{getCurrentRank(userCharacter.stats.xp)}</p>
                  </div>
                </div>
              </Link>

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
              icon="bell fa-bounce text-yellow-400"
              onClick={toggleMenu}
              color="yellow"
            >
              <p>Varsler</p>
              <p className="font-bold">{unreadAlertCount}</p>
            </DropdownOption>
          )}

          {userData && !hasUnreadMessages && (
            <DropdownOption
              to="/meldinger"
              icon="comment-dots"
              onClick={toggleMenu}
            >
              <p>Meldinger</p>
            </DropdownOption>
          )}

          {userData && hasUnreadMessages && (
            <DropdownOption
              to="/meldinger"
              icon="comment-dots fa-bounce text-sky-400"
              onClick={toggleMenu}
              color="sky"
            >
              <p>Meldinger</p>
              <p className="font-bold">{unreadMessageCount}</p>
            </DropdownOption>
          )}

          {userData && (
            <DropdownOption to="/forum" icon="comments" onClick={toggleMenu}>
              Forum
            </DropdownOption>
          )}

          <hr className="border-neutral-700 my-2 sm:hidden" />

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
            icon="book-open"
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
                toggleMenu();
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
      </div>
    </div>
  );
};

export default DropdownRight;
