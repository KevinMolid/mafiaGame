// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import Button from "../components/Button";
import Tab from "../components/Tab";

import FamilySettings from "../components/FamilySettings";
import FamilyMembers from "../components/FamilyMembers";
import FamilyApplications from "../components/FamilyApplications";

import NoFamily from "../components/NoFamily";
import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";

import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// Interfaces
import { FamilyData } from "../Interfaces/Types";

const db = getFirestore();

const Family = () => {
  const { userCharacter } = useCharacter();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<
    "members" | "hq" | "chat" | "profile" | "settings" | "applications"
  >("hq");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "failure" | "warning"
  >("info");
  const [amount, setAmount] = useState<number | "">("");

  if (!userCharacter) return;

  useEffect(() => {
    if (userCharacter && userCharacter.familyId) {
      const fetchFamily = async () => {
        try {
          if (userCharacter.familyId) {
            const familyRef = doc(db, "Families", userCharacter.familyId);
            const familySnap = await getDoc(familyRef);
            if (familySnap.exists()) {
              setFamily(familySnap.data() as FamilyData);
            } else {
              setError("Family does not exist.");
            }
          }
        } catch (error) {
          setError("Error fetching family data.");
        } finally {
          setLoading(false);
        }
      };
      fetchFamily();
    } else {
      setLoading(false);
    }
  }, [userCharacter]);

  // Handle inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, ""); // Remove existing commas
    if (value === "" || isNaN(Number(value))) {
      setAmount(""); // Clear the input if it's empty or invalid
    } else {
      const numericValue = parseInt(value, 10);
      setAmount(numericValue); // Store the raw number
    }
  };

  // Banking functions
  const deposit = async () => {
    if (!family || !userCharacter.familyId) return;
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);
      const familyRef = doc(db, "Families", userCharacter.familyId);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Du må skrive inn beløp.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = family.wealth ? family.wealth + amount : amount;
        const newMoney = userCharacter.stats.money - amount;

        // Check if there is enough money to deposit
        if (newMoney < 0) {
          setMessageType("warning");
          setMessage("Du har ikke så mye penger.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.money": newMoney,
        });

        await updateDoc(familyRef, {
          wealth: newBank,
        });

        setFamily((prevFamily) => {
          if (!prevFamily) return prevFamily; // or handle null case appropriately
          return {
            ...prevFamily,
            wealth: newBank,
          };
        });

        setMessageType("success");
        setMessage(
          `Du donerte $${amount.toLocaleString()} til ${family.name}.`
        );

        setAmount("");
      }
    } catch (error) {
      console.error("Feil ved innskudd:", error);
    }
  };

  const withdraw = async () => {
    if (!family || !userCharacter.familyId) return;
    try {
      const characterRef = doc(db, "Characters", userCharacter.id);
      const familyRef = doc(db, "Families", userCharacter.familyId);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Du må skrive inn verdi.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = family.wealth ? family.wealth - amount : -amount;
        const newMoney = userCharacter.stats.money + amount;

        // Check if there is enough money to withdraw
        if (newBank < 0) {
          setMessageType("warning");
          setMessage("Familien har ikke så mye penger.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.money": newMoney,
        });

        await updateDoc(familyRef, {
          wealth: newBank,
        });

        setFamily((prevFamily) => {
          if (!prevFamily) return prevFamily; // or handle null case appropriately
          return {
            ...prevFamily,
            wealth: newBank,
          };
        });

        setMessageType("success");
        setMessage(`Du tok ut $${amount.toLocaleString()} fra ${family.name}.`);

        setAmount("");
      }
    } catch (error) {
      console.error("Feil ved uttak:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Main img="MafiaBg">
      {/* No family */}
      <NoFamily
        family={family}
        setFamily={setFamily}
        message={message}
        setMessage={setMessage}
        messageType={messageType}
        setMessageType={setMessageType}
      ></NoFamily>

      {family && (
        <>
          {/* Header */}

          <H1>
            <strong>{family.name}</strong>
          </H1>

          {/* InfoBox: Message */}
          {message && <InfoBox type={messageType}>{message}</InfoBox>}

          {/* Family info */}
          <div className="flex gap-4 mb-2">
            <p>
              Leder:{" "}
              <Username
                character={{ id: family.leaderId, username: family.leaderName }}
              />
            </p>
            <p>
              Medlemmer:{" "}
              <strong className="text-neutral-200">
                {family.members.length}
              </strong>
            </p>
            <p>
              Formue:{" "}
              <strong className="text-neutral-200">
                ${family.wealth.toLocaleString()}
              </strong>
            </p>
          </div>

          {family.rules && (
            <InfoBox type="info">
              <strong>Regler:</strong> {family.rules}
            </InfoBox>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* Tabs */}
          <ul className="mb-8 flex flex-wrap">
            <Tab
              active={activePanel === "hq"}
              onClick={() => setActivePanel("hq")}
            >
              Hovedkvarter
            </Tab>

            <Tab
              active={activePanel === "chat"}
              onClick={() => setActivePanel("chat")}
            >
              Chat
            </Tab>

            <Tab
              active={activePanel === "members"}
              onClick={() => setActivePanel("members")}
            >
              Medlemmer
            </Tab>

            <Tab
              active={activePanel === "profile"}
              onClick={() => setActivePanel("profile")}
            >
              Profil
            </Tab>

            <Tab
              active={activePanel === "applications"}
              onClick={() => setActivePanel("applications")}
            >
              Søknader
            </Tab>

            <Tab
              active={activePanel === "settings"}
              onClick={() => setActivePanel("settings")}
            >
              Innstillinger
            </Tab>
          </ul>

          {/* Member panel */}
          {activePanel === "members" && <FamilyMembers family={family} />}

          {/* Chat panel */}
          {activePanel === "chat" && (
            <div>
              <H2>Meldinger</H2>
            </div>
          )}

          {/* Safehouse panel */}
          {activePanel === "hq" && (
            // Headquarters
            <div>
              <H2>Hovedkvarter</H2>
              <H3>Hendelser</H3>
              {}

              <div className="flex flex-col gap-2 p-4 border border-neutral-600 mb-4">
                <H3>Bunker</H3>
                <p>Antall plasser: 1/10</p>
                <div>
                  {" "}
                  <Button>Gå i bunker</Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4 border border-neutral-600 mb-4">
                <H3>Doner</H3>
                <p>Doner penger til familien.</p>
                <form className="flex flex-col gap-2" action="">
                  <input
                    className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                    type="text"
                    placeholder="Beløp"
                    value={amount ? Number(amount).toLocaleString() : ""}
                    onChange={handleInputChange}
                  />
                  <div className="flex gap-2">
                    <Button onClick={deposit}>Doner penger</Button>
                    <Button onClick={withdraw}>Ta ut penger</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Profile panel */}
          {activePanel === "profile" && (
            <div>
              <H2>Profil</H2>
              <p>Dette er familiens profil.</p>
            </div>
          )}

          {/* Applications panel */}
          {activePanel === "applications" && <FamilyApplications />}

          {/* Settings panel */}
          {activePanel === "settings" && (
            <FamilySettings
              setError={setError}
              family={family}
              setFamily={setFamily}
              setMessage={setMessage}
              setMessageType={setMessageType}
            />
          )}
        </>
      )}
    </Main>
  );
};

export default Family;
