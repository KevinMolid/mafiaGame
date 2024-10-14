// Components
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import InfoBox from "../components/InfoBox";
import Button from "../components/Button";
import Username from "../components/Typography/Username";

import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";
import { Character } from "../Interfaces/CharacterTypes";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

type FamilyMember = {
  id: string;
  name: string;
  rank: string;
};

type FamilyData = {
  name: string;
  leaderName: string;
  leaderId: string;
  members: FamilyMember[];
  createdAt: Date;
  rules: string;
  wealth: number;
};

const Family = () => {
  const { character, setCharacter } = useCharacter();
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
  const createFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setError("You must enter a family name.");
      return;
    }
    try {
      const familyId = `family_${Date.now()}`;
      const newFamily = {
        name: familyName,
        leaderName: character.username,
        leaderId: character.id,
        members: [
          {
            id: character.id,
            name: character.username,
            rank: "Boss",
          },
        ],
        createdAt: new Date(),
        rules: "",
        wealth: 0,
      };

      // Create new family document
      await setDoc(doc(db, "Families", familyId), newFamily);

      // Update character with familyId and familyName
      const characterRef = doc(db, "Characters", character.id);
      await setDoc(
        characterRef,
        {
          familyId: familyId,
          familyName: familyName,
        },
        { merge: true }
      );

      // Update character in local state
      setCharacter((prevCharacter) => ({
        ...(prevCharacter as Character),
        familyId: familyId as string,
        familyName: familyName as string,
      }));

      // set Family in local state
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
          <div className="flex gap-4 mb-2">
            <p>
              Leader:{" "}
              <Username
                character={{ id: family.leaderId, username: family.leaderName }}
              />
            </p>
            <p>
              Members:{" "}
              <strong className="text-neutral-200">
                {family.members.length}
              </strong>
            </p>
            <p>
              Wealth:{" "}
              <strong className="text-neutral-200">
                ${family.wealth.toLocaleString()}
              </strong>
            </p>
          </div>

          <InfoBox type="info">
            <strong>Family rules:</strong> {family.rules}
          </InfoBox>

          <div>
            <p>Members:</p>
            {family.members.map((member) => {
              return (
                <p key={member.id}>
                  <Username
                    character={{
                      id: member.id,
                      username: member.name,
                    }}
                  />{" "}
                  - {member.rank}
                </p>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <H1>Family</H1>
          <InfoBox type="info">You are not part of a family.</InfoBox>
          <H2>Create a New Family</H2>
          <form
            action=""
            onSubmit={createFamily}
            className="flex flex-col gap-4"
          >
            <input
              className="bg-neutral-700 py-2 px-4 text-white"
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Enter family name"
            />
            <Button type="submit">Create Family</Button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default Family;
