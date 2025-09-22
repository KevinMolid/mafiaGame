// Components
import Username from "../components/Typography/Username";
import H3 from "../components/Typography/H3";

// Types
import { FamilyData } from "../Interfaces/Types";

type FamilyProfileProps = {
  family: FamilyData;
};

const FamilyProfile = ({ family }: FamilyProfileProps) => {
  return (
    <div>
      <div className="flex flex-col items-center lg:grid lg:grid-cols-[max-content_max-content] gap-4 lg:gap-8 pb-4 border-b border-neutral-700">
        <img
          className="w-[320px] h-[320px] object-cover"
          src={family.img || "/FamilyDefault.jpg"}
          alt={`${family.name} profilbilde`}
        />

        <div className="flex flex-col h-full justify-between gap-4">
          {/* Info */}
          <H3>{family.name}</H3>
          <ul className="grid grid-cols-[min-content_max-content] gap-x-4">
            <li>Leder:</li>
            <li>
              <Username
                character={{
                  id: family.leaderId,
                  username: family.leaderName,
                }}
              />
            </li>

            <li>
              <p>Medlemmer:</p>
            </li>
            <li>
              <ul>
                {family.members.map(
                  (member: { id: string; name: string; rank: string }) => {
                    if (member.rank !== "Boss") {
                      return (
                        <li key={member.id}>
                          <Username
                            character={{
                              id: member.id,
                              username: member.name,
                            }}
                          />
                        </li>
                      );
                    }
                    return null;
                  }
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Profiltekst */}
      <div className="py-6">{family.profileText}</div>
    </div>
  );
};

export default FamilyProfile;
