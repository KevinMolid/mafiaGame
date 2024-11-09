import H1 from "./Typography/H1";
import H2 from "./Typography/H2";
import InfoBox from "./InfoBox";
import Username from "./Typography/Username";
import Familyname from "./Typography/Familyname";
import Button from "./Button";
import Box from "./Box";

import { useCharacter } from "../CharacterContext";

import { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";

const db = getFirestore();

// Interfaces
import { FamilyData } from "../Interfaces/Types";

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
  const [applicationText, setApplicationText] = useState<string>("");

  // Fetch all families from Firestore
  useEffect(() => {
    if (!character || family) return;

    const fetchFamilies = async () => {
      try {
        const familiesSnapshot = await getDocs(collection(db, "Families"));
        const familiesData: FamilyData[] = familiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<FamilyData, "id">),
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
      const newFamilyData = {
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
        img: "",
        profileText: "",
        wealth: 0,
      };

      // Create new family document and get the familyId from doc reference
      const familyDocRef = await addDoc(
        collection(db, "Families"),
        newFamilyData
      );
      const familyId = familyDocRef.id;

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
      setFamily({ id: familyId, ...newFamilyData });
      setFamilyName("");

      setMessageType("success");
      setMessage(`Du opprettet ${familyName} for $${cost.toLocaleString()}.`);
    } catch (error) {
      setMessageType("failure");
      setMessage("Feil ved opprettelse av familie.");
    }
  };

  const handleApplicationTextChange = (e: any) => {
    setApplicationText(e.target.value);
  };

  // Function to add application to the family's "Applications" subcollection
  const sendApplication = async (familyName: string) => {
    if (!character || !familyName) return;

    try {
      const familiesQuery = query(
        collection(db, "Families"),
        where("name", "==", familyName)
      );
      const querySnapshot = await getDocs(familiesQuery);

      if (querySnapshot.empty) {
        setMessageType("warning");
        setMessage("Fant ingen familie med dette navnet");
        return;
      }

      const familyDoc = querySnapshot.docs[0];
      const familyRef = doc(db, "Families", familyDoc.id);
      const applicationsRef = collection(familyRef, "Applications");

      const applicationDocRef = await addDoc(applicationsRef, {
        applicantId: character.id,
        applicantUsername: character.username,
        applicationText: applicationText,
        appliedAt: new Date(),
      });

      // Update character document with activeFamilyApplication
      const characterRef = doc(db, "Characters", character.id);
      await setDoc(
        characterRef,
        {
          activeFamilyApplication: {
            familyId: familyDoc.id,
            familyName: familyName,
            applicationId: applicationDocRef.id,
            applicationText: applicationText,
            appliedAt: new Date(),
          },
        },
        { merge: true }
      );

      setMessageType("success");
      setMessage(`Du har sendt søknad til ${familyName}!`);
      setApplyingTo(null);
    } catch (error) {
      console.error("Error sending application:", error);
      setMessageType("failure");
      setMessage("Feil ved sending av søknad.");
    }
  };

  // Function to cancel the application
  const cancelApplication = async () => {
    if (!character) return;
    if (!character.activeFamilyApplication) return;

    try {
      const { familyId, applicationId } = character.activeFamilyApplication;

      // Delete the application document using the stored applicationId
      const applicationDocRef = doc(
        db,
        "Families",
        familyId,
        "Applications",
        applicationId
      );
      await deleteDoc(applicationDocRef);

      // Delete activeFamilyApplication from character document
      const characterRef = doc(db, "Characters", character.id);
      await updateDoc(characterRef, {
        activeFamilyApplication: deleteField(),
      });

      setMessageType("info");
      setMessage("Søknaden ble avbrutt.");
    } catch (error) {
      console.error("Error cancelling application:", error);
      setMessageType("failure");
      setMessage("Feil ved avbryting av søknad.");
    }
  };

  if (family) return;

  return (
    <>
      <H1>Familie</H1>
      <p className="mb-2">Du tilhører ingen familie.</p>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex flex-col gap-4">
        {/* Create family */}
        {!applyingTo && !character?.activeFamilyApplication && (
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
        {!applyingTo && !character?.activeFamilyApplication && (
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
                        <Familyname family={family}></Familyname>
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
            <div className="flex justify-between items-baseline mb-2">
              <H2>Søknad til {applyingTo}</H2>
              <button
                className="size-10 bg-neutral-700 rounded-lg text-xl hover:bg-neutral-600 hover:text-neutral-200"
                onClick={() => setApplyingTo(null)}
              >
                <i className="fa-solid fa-x"></i>
              </button>
            </div>
            <form action="" className="flex flex-col gap-2">
              <textarea
                rows={8}
                name=""
                id="profileTxt"
                className="bg-neutral-800 px-2 py-1 resize-none"
                value={applicationText}
                onChange={handleApplicationTextChange}
              ></textarea>
              <div className="flex justify-end">
                <Button onClick={() => sendApplication(applyingTo)}>
                  Send søknad
                </Button>
              </div>
            </form>
          </Box>
        )}

        {character?.activeFamilyApplication && (
          <Box>
            <H2>Venter på godkjenning</H2>
            <p className="mb-4">
              Du sendte en søknad til{" "}
              <Familyname
                family={{
                  id: character.activeFamilyApplication.familyId,
                  name: character.activeFamilyApplication.familyName,
                }}
              />
              {" den "}
              {character.activeFamilyApplication.appliedAt &&
                `${character.activeFamilyApplication.appliedAt.toLocaleDateString(
                  "no-NO",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )} kl. ${character.activeFamilyApplication.appliedAt.toLocaleTimeString(
                  "no-NO",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}.`}
            </p>
            {character.activeFamilyApplication.applicationText && (
              <p className="mb-4 text-neutral-200">
                {character.activeFamilyApplication.applicationText}
              </p>
            )}
            <Button style="danger" onClick={cancelApplication}>
              <i className="fa-solid fa-ban"></i> Avbryt søknad
            </Button>
          </Box>
        )}
      </div>
    </>
  );
};

export default NoFamily;
