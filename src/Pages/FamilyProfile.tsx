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
  const { familyID } = useParams<{ familyID: string }>();
  const [familyData, setFamilyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacterData = async () => {
      if (!familyID) {
        setError("Family ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const charDocRef = doc(db, "Families", familyID);
        const charDocSnap = await getDoc(charDocRef);
        if (charDocSnap.exists()) {
          setFamilyData(charDocSnap.data());
        } else {
          setError("Family not found!");
        }
      } catch (err) {
        console.error("Error fetching family data:", err);
        setError("Error fetching family data.");
      } finally {
        setLoading(false);
      }
    };

    if (familyID) {
      fetchCharacterData();
    }
  }, [familyID]);

  if (loading) {
    return <Main>Loading...</Main>;
  }

  if (error) {
    return <Main>{error}</Main>;
  }

  if (!familyData) {
    return <div>No family data available.</div>;
  }

  return (
    <Main>
      <H1>{familyData.name}</H1>
      <p>
        Leader:{" "}
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
