import H1 from "./Typography/H1";
import H2 from "./Typography/H2";
import InfoBox from "./InfoBox";
import Username from "./Typography/Username";
import Button from "./Button";
import Box from "./Box";

import { useCharacter } from "../CharacterContext";

import { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
} from "firebase/firestore";

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
  setFamily: React.Dispatch<React.SetStateAction<FamilyData | null>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  messageType: "info" | "success" | "failure" | "warning";
  setMessageType: React.Dispatch<
    React.SetStateAction<"info" | "success" | "failure" | "warning">
  >;
}

const NoFamily = ({
  family,
  setFamily,
  message,
  setMessage,
  messageType,
  setMessageType,
}: NoFamilyInterface) => {
  const [familyName, setFamilyName] = useState("");
  const { character } = useCharacter();
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  // Fetch all families from Firestore
  useEffect(() => {
    if (!character || family) return;

    const fetchFamilies = async () => {
      try {
        const familiesSnapshot = await getDocs(collection(db, "Families"));
        const familiesData: FamilyData[] = familiesSnapshot.docs.map((doc) => ({
          ...(doc.data() as FamilyData),
        }));
        setFamilies(familiesData);
      } catch (error) {
        setMessageType("failure");
        setMessage("Feil ved henting av familier.");
      }
    };

    fetchFamilies();
  }, []);

  // Create new family
  const createFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!character) return;

    if (!familyName.trim()) {
      setMessageType("warning");
      setMessage("Du må skrive inn ønsket familienavn.");
      return;
    }

    // Check if player has enough money
    const cost = 250000000;
    if (character.stats.money < cost) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å opprette familie.");
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

      const newMoneyValue = character.stats.money - cost;

      // Update character with familyId and familyName
      const characterRef = doc(db, "Characters", character.id);
      await setDoc(
        characterRef,
        {
          familyId: familyId,
          familyName: familyName,
          stats: {
            money: newMoneyValue,
          },
        },
        { merge: true }
      );

      // set Family in local state
      setFamily(newFamily);
      setFamilyName("");

      setMessageType("success");
      setMessage(`Du opprettet ${familyName} for $${cost.toLocaleString()}.`);
    } catch (error) {
      setMessageType("failure");
      setMessage("Feil ved opprettelse av familie.");
    }
  };

  const sendApplication = (familyName: string) => {
    console.log(`Sender søknad til familien ${familyName}`);
  };

  if (family) return;

  return (
    <>
      <H1>Familie</H1>
      <p className="mb-2">Du tilhører ingen familie.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex flex-col gap-4">
        {/* Create family */}
        {!applyingTo && (
          <Box>
            <H2>Opprett ny familie</H2>
            <p className="mb-2">
              Kostnad: <strong className="text-yellow-400">$250,000,000</strong>
            </p>
            <form
              action=""
              onSubmit={createFamily}
              className="flex flex-col gap-2"
            >
              <input
                className="bg-neutral-700 py-2 px-4 placeholder-neutral-400 text-white"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ønsket familienavn"
              />
              <Button type="submit">Opprett familie</Button>
            </form>
          </Box>
        )}

        {/* Apply to family */}
        {!applyingTo && (
          <Box>
            <H2>Bli med i en familie</H2>
            {families.length > 0 ? (
              <ul>
                {families.map((family) => (
                  <li
                    key={family.name}
                    className="mb-4 flex justify-between items-center"
                  >
                    <div>
                      <p>
                        <strong className="text-neutral-200">
                          {family.name}
                        </strong>
                      </p>
                      <small>
                        Leder:{" "}
                        <Username
                          character={{
                            id: family.leaderId,
                            username: family.leaderName,
                          }}
                        />
                      </small>
                    </div>

                    <div>
                      <Button onClick={() => setApplyingTo(family.name)}>
                        Skriv søknad
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No families available to join.</p>
            )}
          </Box>
        )}

        {/* Application */}
        {applyingTo && (
          <Box>
            <div className="flex justify-between items-start">
              <H2>Søknad til {applyingTo}</H2>
              <button
                className="size-10 bg-neutral-700 rounded-lg text-xl hover:bg-neutral-600 hover:text-neutral-200"
                onClick={() => setApplyingTo(null)}
              >
                <i className="fa-solid fa-x"></i>
              </button>
            </div>
            <form action="">
              <Button onClick={() => sendApplication(applyingTo)}>
                Send søknad
              </Button>
            </form>
          </Box>
        )}
      </div>
    </>
  );
};

export default NoFamily;
