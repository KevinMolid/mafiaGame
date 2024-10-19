// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import Button from "../components/Button";
import FamilySettings from "../components/FamilySettings";

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
    "members" | "safehouse" | "chat" | "profile" | "settings"
  >("members");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "failure" | "warning"
  >("info");

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
    <Main img="MafiaBg">
      {/* No family */}
      <NoFamily
        family={family}
        setFamily={setFamily}
        message={message}
        setMessage={setMessage}
        messageType={messageType}
        setMessageType={setMessageType}
      ></NoFamily>

      {family && (
        <>
          {/* Header */}

          <H1>
            Family: <strong>{family.name}</strong>
          </H1>

          {/* InfoBox: Message */}
          {message && <InfoBox type={messageType}>{message}</InfoBox>}

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
          <ul className="mb-8 flex flex-wrap">
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
                (activePanel === "chat" && "bg-neutral-800 border-white")
              }
              onClick={() => setActivePanel("chat")}
            >
              <p className="text-neutral-200 font-medium">Chat</p>
            </li>
            <li
              className={
                " hover:bg-neutral-800 px-4 py-2 max-w-44 border-b-2 border-neutral-700 cursor-pointer " +
                (activePanel === "safehouse" && "bg-neutral-800 border-white")
              }
              onClick={() => setActivePanel("safehouse")}
            >
              <p className="text-neutral-200 font-medium">Safehouse</p>
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

          {/* Chat panel */}
          {activePanel === "chat" && (
            <div>
              <H2>Chat</H2>
            </div>
          )}

          {/* Safehouse panel */}
          {activePanel === "safehouse" && (
            <div>
              <H2>Safehouse</H2>
              <div className="flex flex-col gap-2 p-4 border border-neutral-600 mb-4">
                <H3>Enter Safehouse</H3>
                <p>Slots filled: 1/10</p>
                <Button>Enter Safehouse</Button>
              </div>

              <div className="flex flex-col gap-2 p-4 border border-neutral-600 mb-4">
                <H3>Donate</H3>
                <p>Donate money to the family</p>
                <input
                  className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
                  type="text"
                />
                <Button>Donate Money</Button>
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
            <FamilySettings
              setError={setError}
              family={family}
              setFamily={setFamily}
              setMessage={setMessage}
              setMessageType={setMessageType}
            />
          )}
        </>
      )}
    </Main>
  );
};

export default Family;
