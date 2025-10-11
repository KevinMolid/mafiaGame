// Context
import { useCharacter } from "../CharacterContext";
import { useAuth } from "../AuthContext";
import { getAuth, signOut } from "firebase/auth";
import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
const db = getFirestore();

// Components
import SidebarLink from "./SidebarLink";

const SidebarRight = () => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

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

  if (!userData) return;

  return (
    userData && (
      <div className="hidden xl:block bg-neutral-900 px-4 py-8 text-sm leading-relaxed h-full pb-24 border-l border-neutral-700">
        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {userData?.type === "admin" && (
            <>
              <SidebarLink to="/admin" icon="gears" color="yellow">
                <p>Kontrollpanel</p>
              </SidebarLink>
              <hr className="border-neutral-600" />
            </>
          )}

          {userData && !hasUnreadAlerts && (
            <SidebarLink to="/varsler" icon="bell">
              Varsler
            </SidebarLink>
          )}

          {userData && hasUnreadAlerts && (
            <SidebarLink
              to="/varsler"
              icon="bell fa-bounce text-yellow-400"
              color="yellow"
            >
              <p>Varsler</p>
              <p className="font-bold">{unreadAlertCount}</p>
            </SidebarLink>
          )}

          {userData && !hasUnreadMessages && (
            <SidebarLink to="/meldinger" icon="comment-dots">
              <p>Meldinger</p>
            </SidebarLink>
          )}

          {userData && hasUnreadMessages && (
            <SidebarLink
              to="/meldinger"
              icon="comment-dots fa-bounce text-sky-400"
              color="sky"
            >
              <p>Meldinger</p>
              <p className="font-bold">{unreadMessageCount}</p>
            </SidebarLink>
          )}

          {userData && (
            <SidebarLink to="/forum" icon="comments">
              Forum
            </SidebarLink>
          )}

          <hr className="border-neutral-600" />

          <SidebarLink to="/toppliste" icon="trophy">
            Toppliste
          </SidebarLink>

          <SidebarLink to="/finnspiller" icon="magnifying-glass">
            Finn spiller
          </SidebarLink>

          <SidebarLink to="/statistikk" icon="chart-simple">
            Statistikk
          </SidebarLink>

          <SidebarLink to="/spillguide" icon="book-open">
            Spillguide
          </SidebarLink>

          <hr className="border-neutral-600" />

          {userData && (
            <SidebarLink
              icon="right-from-bracket"
              onClick={() => {
                logOut();
              }}
            >
              <p>Logg ut</p>
            </SidebarLink>
          )}
        </nav>
      </div>
    )
  );
};

export default SidebarRight;
