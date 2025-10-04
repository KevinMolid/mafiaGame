import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Alert from "../components/Alert";
import Username from "../components/Typography/Username";
import Familyname from "../components/Typography/Familyname";

import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useCharacter } from "../CharacterContext";

import firebaseConfig from "../firebaseConfig";
import { initializeApp } from "firebase/app";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define the structure of an alert item (note: timestamp is a Date now)
interface AlertItem {
  id: string;
  type: string;
  newRank: string;
  amountLost: number;
  amountSent: number;
  robberId: string;
  senderId: string;
  familyId: string;
  robberName: string;
  senderName: string;
  familyName: string;
  bountyAmount: number;
  killedPlayerId: string;
  killedPlayerName: string;
  newRole: string;
  removedRole: string;
  userId: string;
  userName: string;
  timestamp: Date;
  read: boolean;
}

// --- helpers ---
type RawTs = any; // Firestore Timestamp | string | number | Date | {seconds, nanoseconds}

const toDate = (ts: RawTs): Date => {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === "function") return ts.toDate(); // Firestore Timestamp
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000); // Timestamp-like
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") return new Date(ts); // ISO
  if (typeof ts === "number") return new Date(ts); // millis
  return new Date(0);
};

// Helper function to format the time difference
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec} sek`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return hrs === 1 ? `${hrs} time` : `${hrs} timer`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? `${days} dag` : `${days} dager`;
};

const Alerts = () => {
  const { userCharacter } = useCharacter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userCharacter || !userCharacter.id) return;

      try {
        // Query the alerts sub-collection for the user's character
        const alertsRef = collection(
          db,
          "Characters",
          userCharacter.id,
          "alerts"
        );
        const alertsQuery = query(alertsRef);
        const alertsSnapshot = await getDocs(alertsQuery);

        const fetchedAlerts: AlertItem[] = alertsSnapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type || "",
            // normalize to Date for easy sorting/formatting
            timestamp: toDate(data.timestamp),
            newRank: data.newRank || "",
            amountLost: data.amountLost || 0,
            amountSent: data.amountSent || 0,
            robberId: data.robberId || "",
            robberName: data.robberName || "",
            senderId: data.senderId || "",
            senderName: data.senderName || "",
            familyId: data.familyId || "",
            familyName: data.familyName || "",
            bountyAmount: data.bountyAmount || 0,
            killedPlayerId: data.killedPlayerId || "",
            killedPlayerName: data.killedPlayerName || "",
            newRole: data.newRole || "",
            removedRole: data.removedRole || "",
            userId: data.userId || "",
            userName: data.userName || "",
            read: data.read || false,
          };
        });

        // Sort alerts by timestamp in descending order (newest first)
        fetchedAlerts.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );

        // Mark unread alerts as read
        const unreadAlerts = fetchedAlerts.filter((alert) => !alert.read);
        if (unreadAlerts.length > 0) {
          const markAlertsAsRead = async () => {
            for (const unreadAlert of unreadAlerts) {
              const alertDocRef = doc(
                db,
                "Characters",
                userCharacter.id,
                "alerts",
                unreadAlert.id
              );
              await updateDoc(alertDocRef, { read: true });
            }
          };
          await markAlertsAsRead();
        }

        setAlerts(fetchedAlerts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [userCharacter]);

  if (loading) {
    return (
      <Main>
        <H1>Alerts</H1>
        <p>Laster varsler...</p>
      </Main>
    );
  }

  return (
    <Main>
      <H1>Varsler</H1>

      {alerts.length === 0 ? (
        <p>Du har ingen varsler.</p>
      ) : (
        <div className="flex gap-1 md:gap-2 flex-col">
          {alerts.map((alert) => (
            <Alert key={alert.id} read={alert.read}>
              {/* Rank alert */}
              {alert.type === "xp" && (
                <small>Du nådde ranken {alert.newRank}.</small>
              )}

              {/* Bounty Reward alert */}
              {alert.type === "bountyReward" && (
                <small>
                  Du mottok ${alert.bountyAmount?.toLocaleString()} for å drepe{" "}
                  <Username
                    character={{
                      id: alert.killedPlayerId,
                      username: alert.killedPlayerName,
                    }}
                  />
                  .
                </small>
              )}

              {/* Robbery alert */}
              {alert.type === "robbery" && alert.amountLost && (
                <small>
                  Du ble ranet av{" "}
                  <Username
                    character={{
                      id: alert.robberId,
                      username: alert.robberName,
                    }}
                  />{" "}
                  og mistet{" "}
                  <span className="text-neutral-200">
                    <i className="fa-solid fa-dollar-sign"></i>{" "}
                    <strong>{alert.amountLost.toLocaleString("nb-NO")}</strong>
                  </span>
                  .
                </small>
              )}

              {/* Bank transfer alert */}
              {alert.type === "banktransfer" && alert.amountSent && (
                <small>
                  <Username
                    character={{
                      id: alert.senderId,
                      username: alert.senderName,
                    }}
                  />{" "}
                  overførte{" "}
                  <span className="text-neutral-200">
                    ${alert.amountSent.toLocaleString()}
                  </span>{" "}
                  til din bankkonto.
                </small>
              )}

              {/* Family Application alert */}
              {alert.type === "applicationAccepted" && (
                <small>
                  Søknaden din ble godkjent. Du er nå medlem av{" "}
                  <Familyname
                    family={{
                      id: alert.familyId,
                      name: alert.familyName,
                    }}
                  />
                  !
                </small>
              )}

              {alert.type === "applicationDeclined" && (
                <small>
                  Din søknad til{" "}
                  <Familyname
                    family={{
                      id: alert.familyId,
                      name: alert.familyName,
                    }}
                  />{" "}
                  ble avslått!
                </small>
              )}

              {/* Kicked from Family alert */}
              {alert.type === "KickedFromFamily" && (
                <small>
                  Du ble kastet ut av familien{" "}
                  <Familyname
                    family={{
                      id: alert.familyId,
                      name: alert.familyName,
                    }}
                  />
                  .
                </small>
              )}

              {/* New Role alert */}
              {alert.type === "newRole" && (
                <small>
                  Din rolle ble endret til{" "}
                  <strong
                    className={
                      (alert.newRole === "admin"
                        ? "text-sky-400"
                        : alert.newRole === "moderator"
                        ? "text-green-400"
                        : "") + " capitalize"
                    }
                  >
                    {alert.newRole}
                  </strong>{" "}
                  av{" "}
                  <Username
                    character={{
                      id: alert.userId,
                      username: alert.userName,
                    }}
                  />
                  .
                </small>
              )}

              {/* Removed Role alert */}
              {alert.type === "removeRole" && (
                <small>
                  Din rolle som{" "}
                  <strong
                    className={
                      (alert.removedRole === "admin"
                        ? "text-sky-400"
                        : alert.removedRole === "moderator"
                        ? "text-green-400"
                        : "") + " capitalize"
                    }
                  >
                    {alert.removedRole}
                  </strong>{" "}
                  ble fjernet av{" "}
                  <Username
                    character={{
                      id: alert.userId,
                      username: alert.userName,
                    }}
                  />
                  .
                </small>
              )}

              <small>{formatTimeAgo(alert.timestamp)}</small>
            </Alert>
          ))}
        </div>
      )}
    </Main>
  );
};

export default Alerts;
