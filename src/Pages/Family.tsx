import H1 from "../components/Typography/H1";

import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import InfoBox from "../components/InfoBox";

const db = getFirestore();

type FamilyData = {
  name: string;
  leaderName: string;
  leaderId: string;
  members: string[];
  createdAt: Date;
  rules: string;
};

const Family = () => {
  const { character } = useCharacter();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!character) return;

  useEffect(() => {
    if (character && character.familyId) {
      const fetchFamily = async () => {
        try {
          if (character.familyId) {
            const familyRef = doc(db, "Families", character.familyId);
            const familySnap = await getDoc(familyRef);
            if (familySnap.exists()) {
              setFamily(familySnap.data() as FamilyData);
            } else {
              setError("Family does not exist.");
            }
          }
        } catch (error) {
          setError("Error fetching family data.");
        } finally {
          setLoading(false);
        }
      };
      fetchFamily();
    } else {
      setLoading(false);
    }
  }, [character]);

  // Create new family
  const createFamily = async () => {
    if (!familyName.trim()) return;
    try {
      const familyId = `family_${Date.now()}`; // Create a unique ID
      const newFamily = {
        name: familyName,
        leaderName: character.username,
        leaderId: character.id,
        members: [character.id],
        createdAt: new Date(),
        rules: "",
      };
      await setDoc(doc(db, "Families", familyId), newFamily);
      setFamily(newFamily);
      setFamilyName("");
    } catch (error) {
      setError("Error creating family.");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {family ? (
        <>
          <H1>
            Family: <strong>{family.name}</strong>
          </H1>
          <div className="flex gap-4">
            <p>
              Leader:{" "}
              <strong className="text-white">{family.leaderName}</strong>
            </p>
            <p>
              Members:{" "}
              <strong className="text-white">{family.members.length}</strong>
            </p>
          </div>
          <div className="bg-neutral-500">
            <InfoBox type="info">Family rules: {family.rules}</InfoBox>
          </div>
        </>
      ) : (
        <>
          <H1>Family</H1>
          <h2>Create a New Family</h2>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Enter family name"
          />
          <button onClick={createFamily}>Create Family</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default Family;
