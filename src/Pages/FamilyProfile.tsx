// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Username from "../components/Typography/Username";

import { useState, useEffect } from "react";

import { useParams } from "react-router-dom";

// Firebase
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FamilyProfile = () => {
  const { familieID } = useParams<{ familieID: string }>();
  const [familyData, setFamilyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacterData = async () => {
      if (!familieID) {
        setError("Family ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const charDocRef = doc(db, "Families", familieID);
        const charDocSnap = await getDoc(charDocRef);
        if (charDocSnap.exists()) {
          setFamilyData(charDocSnap.data());
        } else {
          setError("Familien ble ikke funnet!");
        }
      } catch (err) {
        console.error("Feil ved lasting av familie:", err);
        setError("Feil ved lasting av familie.");
      } finally {
        setLoading(false);
      }
    };

    if (familieID) {
      fetchCharacterData();
    }
  }, [familieID]);

  if (loading) {
    return <Main>Laster familie...</Main>;
  }

  if (error) {
    return <Main>{error}</Main>;
  }

  if (!familyData) {
    return <div>Familie ikke tilgjengelig.</div>;
  }

  return (
    <Main>
      <H1>{familyData.name}</H1>
      <p>
        Leder:{" "}
        <Username
          character={{
            id: familyData.leaderId,
            username: familyData.leaderName,
          }}
        />
      </p>
    </Main>
  );
};

export default FamilyProfile;
