import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Alert from "../components/Alert";
import Username from "../components/Typography/Username";

import { useState, useEffect } from "react";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";
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
  amountLost?: number;
  robberId?: string;
  robberName?: string;
  timestamp: string; // Timestamp is stored as an ISO 8601 string
}

const Alerts = () => {
  const { character } = useCharacter();
  const [alerts, setAlerts] = useState<Alert[]>([]); // Use the Alert type for your state
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
          amountLost: doc.data().amountLost || 0,
          robberId: doc.data().robberId || "",
          robberName: doc.data().robberName || "",
        }));

        // Sort alerts by timestamp in descending order (newest first)
        fetchedAlerts.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

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
        <p>Loading alerts...</p>
      </Main>
    );
  }

  return (
    <Main>
      <H1>Alerts</H1>

      {alerts.length === 0 ? (
        <p>You have no alerts.</p>
      ) : (
        alerts.map((alert) => (
          <Alert key={alert.id}>
            {alert.type === "robbery" && alert.amountLost && (
              <p>
                You where robbed by{" "}
                <Username
                  character={{ id: alert.robberId, username: alert.robberName }}
                />{" "}
                for ${alert.amountLost.toLocaleString()}.
              </p>
            )}

            <small>{new Date(alert.timestamp).toLocaleString()}</small>
          </Alert>
        ))
      )}
    </Main>
  );
};

export default Alerts;
