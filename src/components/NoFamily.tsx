import H1 from "./Typography/H1";
import H2 from "./Typography/H2";
import InfoBox from "./InfoBox";
import Button from "./Button";

import { useCharacter } from "../CharacterContext";
import { Character } from "../Interfaces/CharacterTypes";

import { useState } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

interface NoFamilyInterface {
  family: FamilyData | null;
  setFamily: (newFam: any) => void;
}

const NoFamily = ({ family, setFamily }: NoFamilyInterface) => {
  const [familyName, setFamilyName] = useState("");
  const { character, setCharacter } = useCharacter();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");

  if (!character) return;
  if (family) return;

  // Create new family
  const createFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setMessageType("warning");
      setMessage("You must enter a family name.");
      return;
    }
    try {
      const familyId = `family_${Date.now()}`;
      const newFamily = {
        name: familyName,
        leaderName: character.username,
        leaderId: character.id,
        members: [
          {
            id: character.id,
            name: character.username,
            rank: "Boss",
          },
        ],
        createdAt: new Date(),
        rules: "",
        wealth: 0,
      };

      // Create new family document
      await setDoc(doc(db, "Families", familyId), newFamily);

      // Update character with familyId and familyName
      const characterRef = doc(db, "Characters", character.id);
      await setDoc(
        characterRef,
        {
          familyId: familyId,
          familyName: familyName,
        },
        { merge: true }
      );

      // Update character in local state
      setCharacter((prevCharacter) => ({
        ...(prevCharacter as Character),
        familyId: familyId as string,
        familyName: familyName as string,
      }));

      // set Family in local state
      setFamily(newFamily);
      setFamilyName("");
    } catch (error) {
      setMessageType("failure");
      setMessage("Error creating family.");
    }
  };

  return (
    <>
      <H1>Family</H1>
      <p className="mb-2">You are not part of a family.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      {/* Create family */}
      <div className="border border-neutral-600 p-4 mb-4">
        <H2>Create a New Family</H2>
        <p className="mb-2">
          Price: <strong className="text-yellow-400">$250,000,000</strong>
        </p>
        <form action="" onSubmit={createFamily} className="flex flex-col gap-2">
          <input
            className="bg-neutral-700 py-2 px-4 placeholder-neutral-400 text-white"
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Enter family name"
          />
          <Button type="submit">Create Family</Button>
        </form>
      </div>

      {/* Apply to family */}
      <div className="border border-neutral-600 p-4">
        <H2>Join a Family</H2>
      </div>
    </>
  );
};

export default NoFamily;
