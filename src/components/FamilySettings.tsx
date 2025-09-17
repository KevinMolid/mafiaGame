import H2 from "./Typography/H2";
import H3 from "./Typography/H3";
import Button from "./Button";
import EditFamilyProfile from "./EditFamilyProfile";
import Box from "./Box";
import InfoBox from "./InfoBox";

import { useCharacter } from "../CharacterContext";

import {
  getFirestore,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  arrayUnion,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const db = getFirestore();

// Interfaces
import { FamilyData } from "../Interfaces/Types";
import { useState, useRef } from "react";

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
  const { userCharacter } = useCharacter();
  const [changingProfile, setChangingProfile] = useState<boolean>(false);

  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  const [settingsMessage, setSettingsMessage] = useState<string>("");
  const [settingsMessageType, setSettingsMessageType] = useState<
    "info" | "success" | "failure" | "warning"
  >("info");

  if (!userCharacter || !family) return;

  const isBoss = family.leaderId === userCharacter.id;

  // Function to leave the family
  const leaveFamily = async () => {
    if (!userCharacter.familyId || !family) {
      setError("Du er ikke medlem av noen familie.");
      return;
    }

    try {
      // Remove the user from the family's members array
      const familyRef = doc(db, "Families", userCharacter.familyId);
      await updateDoc(familyRef, {
        events: arrayUnion({
          type: "leftMember",
          characterId: userCharacter.id,
          characterName: userCharacter.username,
          timestamp: new Date(),
        }),
        members: family.members.filter(
          (member) => member.id !== userCharacter.id
        ),
      });

      // Update the character's familyId and familyName to null
      const characterRef = doc(db, "Characters", userCharacter.id);
      await updateDoc(characterRef, { familyId: null, familyName: null });

      // Clear family state
      setFamily(null);

      // Notify the user
      setMessageType("success");
      setMessage(`Du forlot familien ${family.name}.`);
    } catch (error) {
      console.error("Feil ved forlatelse av familie:", error);
      setError("Kunne ikke forlate familien. Vennligst prøv igjen senere.");
    }
  };

  // --- HANDLE INVITE ---
  const handleInvite = async () => {
    const uname = inviteUsername.trim();

    // 1) tomt felt
    if (!uname) {
      setSettingsMessageType("warning");
      setSettingsMessage("Skriv inn brukernavn.");
      inviteInputRef.current?.focus();
      return;
    }

    // 2) ikke inviter deg selv
    if (uname.toLowerCase() === userCharacter.username?.toLowerCase()) {
      setSettingsMessageType("warning");
      setSettingsMessage("Du kan ikke invitere deg selv.");
      inviteInputRef.current?.focus();
      return;
    }

    setInviting(true);
    try {
      // 3) søk etter bruker (case-sensitiv først, så evt. usernameLower)
      let snap = await getDocs(
        query(collection(db, "Characters"), where("username", "==", uname))
      );
      if (snap.empty) {
        snap = await getDocs(
          query(
            collection(db, "Characters"),
            where("usernameLower", "==", uname.toLowerCase())
          )
        );
      }
      if (snap.empty) {
        setSettingsMessageType("failure");
        setSettingsMessage(`Fant ingen spiller med brukernavn «${uname}».`);
        inviteInputRef.current?.focus();
        inviteInputRef.current?.select?.();
        return;
      }

      const userDoc = snap.docs[0];
      const invitedId = userDoc.id;
      const invitedData = userDoc.data() as {
        username?: string;
        familyId?: string;
      };

      // 4) valgfritt: blokkér hvis spilleren allerede er i familie
      if (invitedData.familyId) {
        setSettingsMessageType("warning");
        setSettingsMessage(
          `${invitedData.username || uname} er allerede i en familie.`
        );
        return;
      }

      // 5) lagre invitasjon (justér til din struktur om du har en annen)
      await addDoc(collection(db, "FamilyInvites"), {
        familyId: family.id,
        familyName: family.name,
        invitedId,
        invitedName: invitedData.username || uname,
        inviterId: userCharacter.id,
        inviterName: userCharacter.username,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 6) logg event i familien (valgfritt)
      await updateDoc(doc(db, "Families", family.id), {
        events: arrayUnion({
          type: "inviteSent",
          invitedId,
          invitedName: invitedData.username || uname,
          inviterId: userCharacter.id,
          inviterName: userCharacter.username,
          timestamp: new Date(),
        }),
      });

      setSettingsMessageType("success");
      setSettingsMessage(
        `Invitasjon sendt til ${invitedData.username || uname}.`
      );
      setInviteUsername("");
    } catch (err) {
      console.error(err);
      setSettingsMessageType("failure");
      setSettingsMessage("Kunne ikke sende invitasjon. Prøv igjen.");
    } finally {
      setInviting(false);
    }
  };

  // Function to disband the family
  const disbandFamily = async () => {
    if (
      family &&
      userCharacter.familyId &&
      userCharacter?.id === family.leaderId
    ) {
      try {
        // Delete family document from Firestore
        const familyRef = doc(db, "Families", userCharacter.familyId);
        await deleteDoc(familyRef);

        // Update the character's familyId to null
        const characterRef = doc(db, "Characters", userCharacter.id);
        await updateDoc(characterRef, { familyId: null, familyName: null });

        setMessageType("success");
        setMessage(`Du la ned familien ${family.name}.`);

        // Add a document to the GameEvents to log disbanding
        await addDoc(collection(db, "GameEvents"), {
          eventType: "disbandedFamily",
          familyId: family.id,
          familyName: family.name,
          leaderId: userCharacter.id,
          leaderName: userCharacter.username,
          timestamp: serverTimestamp(),
        });

        // Clear family state
        setFamily(null);
      } catch (error) {
        setError("Feil ved nedleggelse av familie.");
      }
    } else {
      setError("Bare lederen av familien kan legge ned familien.");
    }
  };

  return (
    <div>
      <H2>Innstillinger</H2>

      {settingsMessage && (
        <InfoBox type={settingsMessageType}>{settingsMessage}</InfoBox>
      )}

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
                  ref={inviteInputRef}
                  className="w-full bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                  type="text"
                  placeholder="Brukernavn"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  aria-invalid={
                    inviteUsername.trim().length === 0 ? true : undefined
                  }
                />
                <div>
                  <Button onClick={handleInvite} disabled={inviting}>
                    {inviting ? "Sender…" : "Inviter"}
                  </Button>
                </div>
              </div>
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
