import H2 from "./Typography/H2";
import H3 from "./Typography/H3";
import Button from "./Button";
import Username from "./Typography/Username";
import EditFamilyProfile from "./EditFamilyProfile";
import Box from "./Box";

import { useCharacter } from "../CharacterContext";

import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore";

const db = getFirestore();

// Interfaces
import { FamilyData } from "../Interfaces/Types";
import { useState } from "react";

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
  const [changingProfile, setChangingProfile] = useState<boolean>(false);

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
      <H2>Innstillinger</H2>
      {/* Changing profile */}
      {changingProfile && (
        <Box>
          <div className="flex justify-between items-center">
            <H3>Endre profil</H3>
            <Button
              style="exit"
              size="square"
              onClick={() => setChangingProfile(false)}
            >
              <i className="fa-solid fa-x"></i>
            </Button>
          </div>
          <EditFamilyProfile></EditFamilyProfile>
        </Box>
      )}

      {!changingProfile && (
        <div className="flex flex-col gap-4">
          <Box>
            <div className="flex flex-col gap-2">
              <H3>Inviter spiller</H3>
              <div className="flex gap-2">
                <input
                  className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400 w-full"
                  type="text"
                  placeholder="Brukernavn"
                />
                <div>
                  <Button>Inviter</Button>
                </div>
              </div>
            </div>
          </Box>

          <Box>
            <H3>Tildel roller</H3>
            <div>
              <p>
                Leder:{" "}
                <Username
                  character={{
                    id: family.leaderId,
                    username: family.leaderName,
                  }}
                />
              </p>
              <p>
                Rådgiver:{" "}
                <Username
                  character={{
                    id: family.leaderId,
                    username: family.leaderName,
                  }}
                />
              </p>
              <p>
                Nestleder:{" "}
                <Username
                  character={{
                    id: family.leaderId,
                    username: family.leaderName,
                  }}
                />
              </p>
              <p>Kapteiner:</p>
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
          </Box>

          <div>
            <button className="block hover:underline">
              <i className="fa-solid fa-pen-to-square"></i> Endre regler
            </button>
            <button
              className="block hover:underline"
              onClick={() => setChangingProfile(true)}
            >
              <i className="fa-solid fa-pen-to-square"></i> Endre profil
            </button>
            <hr className="my-2 border-neutral-600" />
            <button
              className="block text-red-400 cursor-pointer hover:underline"
              onClick={disbandFamily}
            >
              <i className="fa-solid fa-ban"></i> Legg ned familie
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilySettings;
