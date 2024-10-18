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
  const [error, setError] = useState<string | null>(null);

  if (!character) return;
  if (family) return;

  // Create new family
  const createFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setError("You must enter a family name.");
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
      setError("Error creating family.");
    }
  };

  return (
    <>
      <H1>Family</H1>
      <InfoBox type="info">You are not part of a family.</InfoBox>
      <H2>Create a New Family</H2>
      <form action="" onSubmit={createFamily} className="flex flex-col gap-4">
        <input
          className="bg-neutral-700 py-2 px-4 text-white"
          type="text"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="Enter family name"
        />
        <Button type="submit">Create Family</Button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </>
  );
};

export default NoFamily;
