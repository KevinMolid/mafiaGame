// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import Button from "../components/Button";

import NoFamily from "../components/NoFamily";
import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";

import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<
    "members" | "profile" | "settings"
  >("members");
  const [invitingPlayer, setinvitingPlayer] = useState<boolean>(false);

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

  // Function to disband the family
  const disbandFamily = async () => {
    if (family && character.familyId && character?.id === family.leaderId) {
      try {
        // Delete family document from Firestore
        const familyRef = doc(db, "Families", character.familyId);
        await deleteDoc(familyRef);

        // Update the character's familyId to null
        const characterRef = doc(db, "Characters", character.id);
        await updateDoc(characterRef, { familyId: null, familyName: null });

        // Update the local character context
        setCharacter((prev) =>
          prev ? { ...prev, familyId: null, familyName: null } : prev
        ); // Set to null

        // Clear family state
        setFamily(null);
      } catch (error) {
        setError("Error disbanding the family.");
      }
    } else {
      setError("Only the family leader can disband the family.");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Main img="MafiaBg">
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

              {/* Family structure */}
              <div className="mb-10 text-center flex flex-col gap-4">
                {/* 1. row: Boss & Consigliere */}
                <div className="grid grid-cols-3">
                  <div></div>
                  <div>
                    <p>Boss</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                  <div>
                    <p>Consigliere</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                </div>

                {/* 2. row: Underboss */}
                <div>
                  <p>Underboss</p>
                  <p>
                    <Username
                      character={{
                        id: family.leaderId,
                        username: family.leaderName,
                      }}
                    />
                  </p>
                </div>

                {/* 3. row: Caporegimes */}

                <div className="grid grid-cols-3">
                  <div>
                    <p>Caporegime</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                  <div>
                    <p>Caporegime</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                  <div>
                    <p>Caporegime</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                </div>

                {/* 4. row:: Soldiers */}
                <div className="grid grid-cols-3">
                  <div>
                    <p>Soldiers</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                  <div>
                    <p>Soldiers</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                  <div>
                    <p>Soldiers</p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                    <p>
                      <Username
                        character={{
                          id: family.leaderId,
                          username: family.leaderName,
                        }}
                      />
                    </p>
                  </div>
                </div>
              </div>

              {/* Associates */}
              <div>
                <p>Associates</p>
                {family.members.map((member) => {
                  return (
                    <p key={member.id}>
                      <Username
                        character={{
                          id: member.id,
                          username: member.name,
                        }}
                      />
                    </p>
                  );
                })}
              </div>
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
              <button onClick={() => setinvitingPlayer(true)}>
                Invite player
              </button>
              <p>Assign roles</p>
              <hr className="my-2 border-neutral-600" />
              <p>Edit Family rules</p>
              <p>Edit Family profile</p>
              <hr className="my-2 border-neutral-600" />
              <p
                className="text-red-400 cursor-pointer hover:underline"
                onClick={disbandFamily}
              >
                <i className="fa-solid fa-ban"></i> Disband family
              </p>

              {/* Invite player*/}
              {invitingPlayer && (
                <div className="fixed top-1/2 left-1/2 z-10 bg-black/50 w-full h-full -translate-x-1/2 -translate-y-1/2">
                  <div className="fixed w-2/3 min-w-[320px] max-w-[400px] top-1/2 left-1/2 bg-neutral-900 -translate-x-1/2 -translate-y-1/2 p-8 border border-neutral-600 rounded-lg flex flex-col gap-2">
                    <div
                      className="absolute top-0 right-0 bg-neutral-700 hover:bg-neutral-600 w-10 h-10 flex justify-center items-center rounded-tr-md cursor-pointer"
                      onClick={() => setinvitingPlayer(false)}
                    >
                      <i className="text-neutral-200 text-xl fa-solid fa-x"></i>
                    </div>
                    <H3>Invite player</H3>
                    <p>Invite a player to {family.name}</p>
                    <input
                      className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
                      type="text"
                    />
                    <Button>Send Invitation</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Main>
  );
};

export default Family;
