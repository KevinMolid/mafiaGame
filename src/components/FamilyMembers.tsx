import H2 from "./Typography/H2";
import Username from "./Typography/Username";
import { useCharacter } from "../CharacterContext";
import Button from "./Button";
import { useState } from "react";

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

interface FamilyMembersInterface {
  family: FamilyData;
}

const FamilyMembers = ({ family }: FamilyMembersInterface) => {
  const { userCharacter } = useCharacter();
  const [editing, setEditing] = useState(false);
  const [playerToKick, setPlayerToKick] = useState<{
    id?: string;
    username?: string;
  }>({});

  if (!userCharacter || !family) return null;

  // Function to render members by rank
  const renderMembersByRank = (rank: string) => {
    const membersWithRank = family.members.filter(
      (member) => member.rank === rank
    );
    if (membersWithRank.length === 0) {
      return <p className="text-neutral-200">-</p>; // Render "Ingen" if no members with this rank
    }
    return membersWithRank.map((member) => (
      <p key={member.id} className="flex justify-center items-center gap-2">
        <Username character={{ id: member.id, username: member.name }} />
        {editing && member.rank !== "Boss" && (
          <i
            className="fa-solid fa-ban text-red-400 hover:text-red-300 cursor-pointer"
            onClick={() =>
              setPlayerToKick({ id: member.id, username: member.name })
            }
          ></i>
        )}
      </p>
    ));
  };

  // Check if the user is the boss
  const isBoss = userCharacter.id === family.leaderId;

  return (
    <div>
      <div className="flex items-center justify-between">
        <H2>Medlemmer</H2>

        {isBoss && !editing && !playerToKick.id && (
          <Button
            size="small"
            style="black"
            onClick={() => setEditing(!editing)}
          >
            <i className="fa-solid fa-pen-to-square"></i> Endre
          </Button>
        )}
        {isBoss && editing && !playerToKick.id && (
          <Button
            size="small"
            style="black"
            onClick={() => setEditing(!editing)}
          >
            <i className="fa-solid fa-x"></i>
          </Button>
        )}
      </div>

      {/* Kick box */}
      {playerToKick.id && (
        <div className="text-center w-full max-w-[400px] mx-auto my-10 bg-neutral-900 border border-red-400 py-4 px-4 rounded-lg">
          <p className="text-2xl mb-4 text-red-400">
            <i className="fa-solid fa-ban"></i>
          </p>
          <p className="mb-4">
            {" "}
            Vil du kaste{" "}
            <Username
              character={{
                id: playerToKick.id,
                username: playerToKick.username,
              }}
            />{" "}
            ut av familien?
          </p>
          <div className="flex justify-center gap-2 m-2">
            <Button style="danger">Kast ut</Button>
            <Button style="secondary" onClick={() => setPlayerToKick({})}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Family structure */}
      {!playerToKick.id && (
        <>
          <div className="my-10 text-center flex flex-col gap-4 max-w-[800px]">
            {/* Render roles based on rank dynamically */}
            <div className="grid grid-cols-3">
              <div></div>
              <div>
                <p>
                  Leder{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}
                </p>
                {renderMembersByRank("Boss")}
              </div>

              {/* Consigliere */}
              <div>
                <p>
                  Rådgiver{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Consigliere")}
              </div>
            </div>

            {/* Underboss */}
            <div>
              <p>
                Nestleder{" "}
                {editing && (
                  <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                )}{" "}
              </p>
              {renderMembersByRank("Underboss")}
            </div>

            {/* Caporegimes */}
            <div className="grid grid-cols-3">
              <div>
                <p>
                  Kaptein{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Capo")}
              </div>
              <div>
                <p>
                  Kaptein{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Capo")}
              </div>
              <div>
                <p>
                  Kaptein{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Capo")}
              </div>
            </div>

            {/* Soldiers */}
            <div className="grid grid-cols-3">
              <div>
                <p>
                  Soldater{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Soldier")}
              </div>
              <div>
                <p>
                  Soldater{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Soldier")}
              </div>
              <div>
                <p>
                  Soldater{" "}
                  {editing && (
                    <i className="text-sky-300 hover:text-sky-200 cursor-pointer fa-solid fa-user-plus"></i>
                  )}{" "}
                </p>
                {renderMembersByRank("Soldier")}
              </div>
            </div>
          </div>

          {/* Associates */}
          <div className="flex flex-col text-center max-w-[800px]">
            <p>Medlemmer</p>
            {renderMembersByRank("Member")}
          </div>
        </>
      )}
    </div>
  );
};

export default FamilyMembers;
