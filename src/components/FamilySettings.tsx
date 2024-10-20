import H2 from "./Typography/H2";
import H3 from "./Typography/H3";
import Button from "./Button";
import Username from "./Typography/Username";

import { useCharacter } from "../CharacterContext";

import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore";

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

interface FamilySettingsInterface {
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  family: FamilyData;
  setFamily: React.Dispatch<React.SetStateAction<FamilyData | null>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setMessageType: React.Dispatch<
    React.SetStateAction<"info" | "success" | "failure" | "warning">
  >;
}

const FamilySettings = ({
  setError,
  family,
  setFamily,
  setMessage,
  setMessageType,
}: FamilySettingsInterface) => {
  const { character, setCharacter } = useCharacter();

  if (!character || !family) return;

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

        setMessageType("success");
        setMessage(`You disbanded ${family.name}`);

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

  return (
    <div>
      <H2>Settings</H2>
      <div className="flex flex-col gap-2 p-4 border border-neutral-600 mb-4">
        <H3>Invite player</H3>
        <input
          className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
          type="text"
        />
        <Button>Send Invitation</Button>
      </div>

      <div className="flex flex-col gap-2 p-4 border border-neutral-600 mb-4">
        <H3>Assign roles</H3>
        <div>
          <p>
            Boss:{" "}
            <Username
              character={{
                id: family.leaderId,
                username: family.leaderName,
              }}
            />
          </p>
          <p>
            Consigliere:{" "}
            <Username
              character={{
                id: family.leaderId,
                username: family.leaderName,
              }}
            />
          </p>
          <p>
            Underboss:{" "}
            <Username
              character={{
                id: family.leaderId,
                username: family.leaderName,
              }}
            />
          </p>
          <p>Caporegimes:</p>
          <p>
            {" "}
            <Username
              character={{
                id: family.leaderId,
                username: family.leaderName,
              }}
            />
          </p>
          <p>
            {" "}
            <Username
              character={{
                id: family.leaderId,
                username: family.leaderName,
              }}
            />
          </p>
          <p>
            {" "}
            <Username
              character={{
                id: family.leaderId,
                username: family.leaderName,
              }}
            />
          </p>
        </div>
      </div>

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
    </div>
  );
};

export default FamilySettings;