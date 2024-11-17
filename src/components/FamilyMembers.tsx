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
  const { character } = useCharacter();
  const [editing, setEditing] = useState(false);

  if (!character || !family) return null;

  // Function to render members by rank
  const renderMembersByRank = (rank: string) => {
    const membersWithRank = family.members.filter(
      (member) => member.rank === rank
    );
    if (membersWithRank.length === 0) {
      return <p>Ingen</p>; // Render "Ingen" if no members with this rank
    }
    return membersWithRank.map((member) => (
      <p key={member.id}>
        <Username character={{ id: member.id, username: member.name }} />
      </p>
    ));
  };

  // Check if the user is the boss
  const isBoss = character.id === family.leaderId;

  return (
    <div>
      <div className="flex items-center justify-between">
        <H2>Medlemmer</H2>
        {isBoss && !editing && (
          <Button
            size="small"
            style="black"
            onClick={() => setEditing(!editing)}
          >
            <i className="fa-solid fa-pen-to-square"></i> Endre
          </Button>
        )}
        {isBoss && editing && (
          <Button
            size="small"
            style="black"
            onClick={() => setEditing(!editing)}
          >
            <i className="fa-solid fa-x"></i>
          </Button>
        )}
      </div>

      {/* Family structure */}
      <div className="my-10 text-center flex flex-col gap-4">
        {/* Render roles based on rank dynamically */}
        <div className="grid grid-cols-3">
          <div></div>
          <div>
            <p>Leder {editing && <i className="fa-solid fa-user-plus"></i>}</p>
            {renderMembersByRank("Boss")}
          </div>
          <div>
            <p>
              Rådgiver {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Consigliere")}
          </div>
        </div>

        {/* Underboss */}
        <div>
          <p>
            Nestleder {editing && <i className="fa-solid fa-user-plus"></i>}
          </p>
          {renderMembersByRank("Underboss")}
        </div>

        {/* Caporegimes */}
        <div className="grid grid-cols-3">
          <div>
            <p>
              Kaptein {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Capo")}
          </div>
          <div>
            <p>
              Kaptein {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Capo")}
          </div>
          <div>
            <p>
              Kaptein {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Capo")}
          </div>
        </div>

        {/* Soldiers */}
        <div className="grid grid-cols-3">
          <div>
            <p>
              Soldater {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Soldier")}
          </div>
          <div>
            <p>
              Soldater {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Soldier")}
          </div>
          <div>
            <p>
              Soldater {editing && <i className="fa-solid fa-user-plus"></i>}
            </p>
            {renderMembersByRank("Soldier")}
          </div>
        </div>
      </div>

      {/* Associates */}
      <div>
        <p>Medlemmer</p>
        {family.members
          .filter((member) => member.rank === "Member")
          .map((member) => (
            <p key={member.id}>
              <Username character={{ id: member.id, username: member.name }} />
            </p>
          ))}
      </div>
    </div>
  );
};

export default FamilyMembers;
