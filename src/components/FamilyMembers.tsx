import H2 from "./Typography/H2";
import Username from "./Typography/Username";

import { useCharacter } from "../CharacterContext";

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

  if (!character || !family) return;

  return (
    <div>
      <H2>Medlemmer</H2>

      {/* Family structure */}
      <div className="mb-10 text-center flex flex-col gap-4">
        {/* 1. row: Boss & Consigliere */}
        <div className="grid grid-cols-3">
          <div></div>
          <div>
            <p>Leder</p>
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
            <p>Rådgiver</p>
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
          <p>Nestleder</p>
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
            <p>Kaptein</p>
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
            <p>Kaptein</p>
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
            <p>Kaptein</p>
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
            <p>Soldater</p>
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
            <p>Soldater</p>
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
            <p>Soldater</p>
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
        <p>Medlemmer</p>
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
  );
};

export default FamilyMembers;
