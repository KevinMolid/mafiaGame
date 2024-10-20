import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import InfoBox from "../components/InfoBox";

import { useState, useEffect } from "react";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";
import { useCharacter } from "../CharacterContext";

import firebaseConfig from "../firebaseConfig";
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Alerts = () => {
  const { character } = useCharacter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!character || !character.id) return;

      try {
        // Query the alerts sub-collection for the user's character
        const alertsRef = collection(db, "Characters", character.id, "alerts");
        const alertsQuery = query(alertsRef);
        const alertsSnapshot = await getDocs(alertsQuery);

        const fetchedAlerts = alertsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

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
        <p>No alerts available.</p>
      ) : (
        alerts.map((alert) => (
          <InfoBox key={alert.id} type="info">
            <p>{alert.message}</p>
            <small>{new Date(alert.timestamp).toLocaleString()}</small>
          </InfoBox>
        ))
      )}
    </Main>
  );
};

export default Alerts;
