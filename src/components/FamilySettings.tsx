import H2 from "./Typography/H2";
import H3 from "./Typography/H3";
import Button from "./Button";
import EditFamilyProfile from "./EditFamilyProfile";
import Box from "./Box";

import { useCharacter } from "../CharacterContext";

import {
  getFirestore,
  writeBatch,
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

// Interfaces
import { FamilyData } from "../Interfaces/Types";
import { useState } from "react";

const db = getFirestore();

interface FamilySettingsInterface {
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  family: FamilyData;
  setFamily: React.Dispatch<React.SetStateAction<FamilyData | null>>;
  setMessage: React.Dispatch<React.SetStateAction<React.ReactNode>>;
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
  const { userCharacter } = useCharacter();
  const [changingProfile, setChangingProfile] = useState<boolean>(false);

  const navigate = useNavigate();

  if (!userCharacter || !family) return null;

  const isBoss = family.leaderId === userCharacter.id;

  // Leave family
  const leaveFamily = async () => {
    if (!userCharacter?.familyId || !family) {
      setError("Du er ikke medlem av noen familie.");
      return;
    }

    try {
      const familyRef = doc(db, "Families", userCharacter.familyId);

      // 1) Remove member from family.members (using current local list)
      await updateDoc(familyRef, {
        members: family.members.filter((m) => m.id !== userCharacter.id),
      });

      // 2) Add event to subcollection: Families/{id}/Events
      await addDoc(collection(familyRef, "Events"), {
        type: "leftMember",
        characterId: userCharacter.id,
        characterName: userCharacter.username,
        timestamp: serverTimestamp(),
      });

      // 3) Clear character.familyId / familyName
      const characterRef = doc(db, "Characters", userCharacter.id);
      await updateDoc(characterRef, { familyId: null, familyName: null });

      // 4) UI updates
      setFamily(null);
      setMessageType("success");
      setMessage(`Du forlot familien ${family.name}.`);
    } catch (error) {
      console.error("Feil ved forlatelse av familie:", error);
      setError("Kunne ikke forlate familien. Vennligst prøv igjen senere.");
    }
  };

  // Disband family
  const disbandFamily = async () => {
    if (!family || !userCharacter?.id || userCharacter.id !== family.leaderId) {
      setError("Bare lederen av familien kan legge ned familien.");
      return;
    }

    try {
      setError(null);

      const batch = writeBatch(db);

      const familyId = family.id;
      const familyName = family.name;

      for (const m of family.members ?? []) {
        const charRef = doc(db, "Characters", m.id);
        batch.update(charRef, { familyId: null, familyName: null });
      }

      const gameEventRef = doc(collection(db, "GameEvents"));
      batch.set(gameEventRef, {
        eventType: "disbandedFamily",
        familyId,
        familyName,
        leaderId: userCharacter.id,
        leaderName: userCharacter.username,
        timestamp: serverTimestamp(),
      });

      const familyRef = doc(db, "Families", familyId);
      batch.delete(familyRef);

      await batch.commit();

      setFamily(null);
      setMessageType("success");
      setMessage(`Du la ned familien ${familyName}.`);
      navigate("/familie");
    } catch (e) {
      console.error(e);
      setError("Feil ved nedleggelse av familie.");
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
          <EditFamilyProfile />
        </Box>
      )}

      {!changingProfile && (
        <div className="flex flex-col gap-4">
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
            {isBoss ? (
              <button
                className="block text-red-400 cursor-pointer hover:underline"
                onClick={disbandFamily}
              >
                <i className="fa-solid fa-ban"></i> Legg ned familien
              </button>
            ) : (
              <button
                className="block text-red-400 cursor-pointer hover:underline"
                onClick={leaveFamily}
              >
                <i className="fa-solid fa-ban"></i> Forlat familien
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilySettings;
