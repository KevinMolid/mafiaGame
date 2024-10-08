import H1 from "../components/Typography/H1";
import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

type FamilyData = {
  name: string;
  leaderName: string;
  leaderId: string;
  members: string[];
  createdAt: Date;
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
      <H1>Family</H1>
      {family ? (
        <div>
          <h2>
            Welcome to the <strong className="text-white">{family.name}</strong>{" "}
            Family!
          </h2>
          <p>Leader: {family.leaderName}</p>
          <p>Members: {family.members.length}</p>
          {/* Add more family details here */}
        </div>
      ) : (
        <div>
          <h2>Create a New Family</h2>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Enter family name"
          />
          <button onClick={createFamily}>Create Family</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default Family;
