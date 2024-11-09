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
  timestamp: string; // Timestamp is stored as an ISO 8601 string
  read: boolean;
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} - ${hours}:${minutes}`;
};

const Alerts = () => {
  const { character } = useCharacter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!character || !character.id) return;

      try {
        // Query the alerts sub-collection for the user's character
        const alertsRef = collection(db, "Characters", character.id, "alerts");
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
          read: doc.data().read || false,
        }));

        // Sort alerts by timestamp in descending order (newest first)
        fetchedAlerts.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Mark unread alerts as read
        const unreadAlerts = fetchedAlerts.filter((alert) => !alert.read);
        if (unreadAlerts.length > 0) {
          const markAlertsAsRead = async () => {
            for (const unreadAlert of unreadAlerts) {
              const alertDocRef = doc(
                db,
                "Characters",
                character.id,
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
  }, [character]);

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
        <div className="flex gap-2 flex-col">
          {alerts.map((alert) => (
            <Alert key={alert.id} read={alert.read}>
              {/* Rank alert */}
              {alert.type === "xp" && (
                <small>Du nådde ranken {alert.newRank}.</small>
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

              <small>{formatDate(alert.timestamp)}</small>
            </Alert>
          ))}
        </div>
      )}
    </Main>
  );
};

export default Alerts;
