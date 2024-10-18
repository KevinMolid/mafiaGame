// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";

import NoFamily from "../components/NoFamily";
import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
  const { character } = useCharacter();
  const [family, setFamily] = useState<FamilyData | null>(null);
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

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Main>
      {/* No family */}
      <NoFamily family={family} setFamily={setFamily}></NoFamily>

      {family && (
        <>
          {/* Header */}
          <div className="flex justify-between items-baseline">
            <H1>
              Family: <strong>{family.name}</strong>
            </H1>
            {/* Menu button */}
            <div
              className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-200 rounded-md flex justify-center items-center cursor-pointer"
              onClick={() => console.log("clicked")}
            >
              <i className="text-xl fa-solid fa-ellipsis-vertical"></i>
            </div>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* Dropdown */}
          <div className="bg-neutral-800">
            <p>Disband family</p>
          </div>

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
      )}
    </Main>
  );
};

export default Family;
