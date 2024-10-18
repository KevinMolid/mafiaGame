// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
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
  const [activePanel, setActivePanel] = useState<
    "members" | "profile" | "settings"
  >("members");

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

          <H1>
            Family: <strong>{family.name}</strong>
          </H1>

          {/* Family info */}
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

          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* Tabs */}
          <ul className="mb-8 flex">
            <li
              className={
                " hover:bg-neutral-800 px-4 py-2 max-w-44 border-b-2 border-neutral-700 cursor-pointer " +
                (activePanel === "members" && "bg-neutral-800 border-white")
              }
              onClick={() => setActivePanel("members")}
            >
              <p className="text-neutral-200 font-medium">Members</p>
            </li>
            <li
              className={
                " hover:bg-neutral-800 px-4 py-2 max-w-44 border-b-2 border-neutral-700 cursor-pointer " +
                (activePanel === "profile" && "bg-neutral-800 border-white")
              }
              onClick={() => setActivePanel("profile")}
            >
              <p className="text-neutral-200 font-medium">Profile</p>
            </li>
            <li
              className={
                " hover:bg-neutral-800 px-4 py-2 max-w-44 border-b-2 border-neutral-700 cursor-pointer " +
                (activePanel === "settings" && "bg-neutral-800 border-white")
              }
              onClick={() => setActivePanel("settings")}
            >
              <p className="text-neutral-200 font-medium">Settings</p>
            </li>
          </ul>

          {/* Member panel */}
          {activePanel === "members" && (
            <div>
              <H2>Members</H2>
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
          )}

          {/* Profile panel */}
          {activePanel === "profile" && (
            <div>
              <H2>Profile</H2>
              <p>This is the family profile text</p>
            </div>
          )}

          {/* Settings panel */}
          {activePanel === "settings" && (
            <div>
              <H2>Settings</H2>
              <p>Invite player</p>
              <p>Assign roles</p>
              <hr className="my-2 border-neutral-600" />
              <p>Edit Family rules</p>
              <p>Edit Family profile</p>
              <hr className="my-2 border-neutral-600" />
              <p className="text-red-400">Disband family</p>
            </div>
          )}
        </>
      )}
    </Main>
  );
};

export default Family;
