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
  Timestamp,
} from "firebase/firestore";
import { useCharacter } from "../CharacterContext";

import firebaseConfig from "../firebaseConfig";
import { initializeApp } from "firebase/app";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define the structure of an alert
interface Alert {
  id: string;
  type: string;
  newRank?: string;
  amountLost?: number;
  amountSent?: number;
  robberId?: string;
  senderId?: string;
  familyId?: string;
  robberName?: string;
  senderName?: string;
  familyName?: string;
  bountyAmount?: number;
  killedPlayerId?: string;
  killedPlayerName?: string;
  timestamp: Timestamp;
  read: boolean;
}

// Helper function to format the time difference
const formatTimeAgo = (timestamp: Timestamp): string => {
  const currentTime = new Date();
  const alertTime = timestamp.toDate();
  const differenceInSeconds = Math.floor(
    (currentTime.getTime() - alertTime.getTime()) / 1000
  );

  if (differenceInSeconds < 60) {
    return `${differenceInSeconds} sek`;
  }
  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min`;
  }
  const differenceInHours = Math.floor(differenceInMinutes / 60);
  if (differenceInHours < 24) {
    if (differenceInHours === 1) {
      return `${differenceInHours} time`;
    }
    return `${differenceInHours} timer`;
  }
  const differenceInDays = Math.floor(differenceInHours / 24);
  if (differenceInDays === 1) {
    return `${differenceInDays} dag`;
  }
  return `${differenceInDays} dager`;
};

const Alerts = () => {
  const { userCharacter } = useCharacter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
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

        const fetchedAlerts: Alert[] = alertsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: doc.data().type || "",
          timestamp: doc.data().timestamp || "",
          newRank: doc.data().newRank || "",
          amountLost: doc.data().amountLost || 0,
          amountSent: doc.data().amountSent || 0,
          robberId: doc.data().robberId || "",
          robberName: doc.data().robberName || "",
          senderId: doc.data().senderId || "",
          senderName: doc.data().senderName || "",
          familyId: doc.data().familyId || "",
          familyName: doc.data().familyName || "",
          bountyAmount: doc.data().bountyAmount || 0,
          killedPlayerId: doc.data().killedPlayerId || "",
          killedPlayerName: doc.data().killedPlayerName || "",
          read: doc.data().read || false,
        }));

        // Sort alerts by timestamp in descending order (newest first)
        fetchedAlerts.sort(
          (a, b) =>
            b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
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
                    ${alert.amountLost.toLocaleString()}
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

              <small>{formatTimeAgo(alert.timestamp)}</small>
            </Alert>
          ))}
        </div>
      )}
    </Main>
  );
};

export default Alerts;
