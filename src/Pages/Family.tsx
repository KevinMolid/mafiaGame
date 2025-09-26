// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import InfoBox from "../components/InfoBox";
import Username from "../components/Typography/Username";
import Button from "../components/Button";
import Tab from "../components/Tab";
import Box from "../components/Box";

import FamilySettings from "../components/FamilySettings";
import FamilyMembers from "../components/FamilyMembers";
import FamilyApplications from "../components/FamilyApplications";
import FamilyProfile from "./FamilyProfilePage";

import NoFamily from "../components/NoFamily";
import { useState, useEffect } from "react";
import { useCharacter } from "../CharacterContext";

import { formatTimestamp } from "../Functions/TimeFunctions";

import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

// Interfaces
import { FamilyData } from "../Interfaces/Types";

export interface Application {
  documentId: string;
  applicantId: string;
  applicantUsername: string;
  applicationText: string;
  appliedAt: Date;
}

type FamilyEvent = {
  type: "created" | "newMember" | "kickedMember" | "leftMember" | string;
  characterId?: string;
  characterName?: string;
  timestamp?: any; // Firestore Timestamp | Date
};

const db = getFirestore();

const Family = () => {
  const { userCharacter } = useCharacter();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
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

  if (!userCharacter) return null;

  // Fetching family data with onSnapshot
  useEffect(() => {
    setLoading(true);

    if (!userCharacter) {
      setFamily(null);
      setLoading(false);
      return;
    }

    if (!userCharacter.familyId) {
      setFamily(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "Families", userCharacter.familyId),
      (snap) => {
        if (!snap.exists()) {
          setFamily(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as FamilyData;
        setFamily({ ...data, id: snap.id });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Kunne ikke hente familie.");
        setLoading(false);
      }
    );

    return unsub;
  }, [userCharacter?.familyId]);

  // Subscribe to Events subcollection (ordered by timestamp desc)
  useEffect(() => {
    if (!userCharacter?.familyId) {
      setEvents([]);
      return;
    }

    const eventsRef = collection(db, "Families", userCharacter.familyId, "Events");
    const q = query(eventsRef, orderBy("timestamp", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: FamilyEvent[] = snap.docs.map((d) => d.data() as FamilyEvent);
        setEvents(items);
      },
      (err) => {
        console.error("events onSnapshot error:", err);
        setEvents([]);
      }
    );

    return unsub;
  }, [userCharacter?.familyId]);

  // Fetch applications
  useEffect(() => {
    if (!userCharacter?.familyId) return;

    const fetchApplications = async () => {
      if (!userCharacter.familyId) return;
      setLoading(true);
      try {
        const applicationsRef = collection(
          db,
          "Families",
          userCharacter.familyId,
          "Applications"
        );
        const applicationsSnapshot = await getDocs(applicationsRef);
        const applicationsList: Application[] = applicationsSnapshot.docs.map((doc) => ({
          documentId: doc.id,
          applicantId: doc.data().applicantId,
          applicantUsername: doc.data().applicantUsername,
          applicationText: doc.data().applicationText,
          appliedAt: doc.data().appliedAt?.toDate(),
        }));
        setApplications(applicationsList);
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError("Error fetching applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [userCharacter?.familyId]);

  // Handle inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "");
    if (value === "" || isNaN(Number(value))) {
      setAmount("");
    } else {
      const numericValue = parseInt(value, 10);
      setAmount(numericValue);
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

      if (amount) {
        const newBank = family.wealth ? family.wealth + amount : amount;
        const newMoney = userCharacter.stats.money - amount;

        if (newMoney < 0) {
          setMessageType("warning");
          setMessage("Du har ikke så mye penger.");
          return;
        }

        await updateDoc(characterRef, { "stats.money": newMoney });
        await updateDoc(familyRef, { wealth: newBank });

        setFamily((prevFamily) =>
          prevFamily ? { ...prevFamily, wealth: newBank } : prevFamily
        );

        setMessageType("success");
        setMessage(`Du donerte $${amount.toLocaleString()} til ${family.name}.`);
        setAmount("");
      }
    } catch (err) {
      console.error("Feil ved innskudd:", err);
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

      if (amount) {
        const newBank = family.wealth ? family.wealth - amount : -amount;
        const newMoney = userCharacter.stats.money + amount;

        if (newBank < 0) {
          setMessageType("warning");
          setMessage("Familien har ikke så mye penger.");
          return;
        }

        await updateDoc(characterRef, { "stats.money": newMoney });
        await updateDoc(familyRef, { wealth: newBank });

        setFamily((prevFamily) =>
          prevFamily ? { ...prevFamily, wealth: newBank } : prevFamily
        );

        setMessageType("success");
        setMessage(`Du tok ut $${amount.toLocaleString()} fra ${family.name}.`);
        setAmount("");
      }
    } catch (err) {
      console.error("Feil ved uttak:", err);
    }
  };

  // Already subscribed desc; keep a safe sort fallback if needed
  const sortedEvents = events.slice().sort((a, b) => {
    const toMs = (t: any) => (t?.toDate ? t.toDate().getTime() : new Date(t ?? 0).getTime());
    return toMs(b.timestamp) - toMs(a.timestamp);
  });

  if (loading) {
    return <p>Laster...</p>;
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
      />

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
            <Tab active={activePanel === "hq"} onClick={() => setActivePanel("hq")}>
              Hovedkvarter
            </Tab>

            <Tab active={activePanel === "chat"} onClick={() => setActivePanel("chat")}>
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

            <div className="flex-grow relative">
              <Tab
                active={activePanel === "applications"}
                onClick={() => setActivePanel("applications")}
              >
                <div className="flex justify-center gap-2">
                  Søknader{" "}
                  {applications.length > 0 && (
                    <div className="text-sky-400">{applications.length}</div>
                  )}
                </div>
              </Tab>
            </div>

            <Tab
              active={activePanel === "settings"}
              onClick={() => setActivePanel("settings")}
            >
              Innstillinger
            </Tab>
          </ul>

          {/* Member panel */}
          {activePanel === "members" && (
            <FamilyMembers
              family={family}
              setMessage={setMessage}
              setMessageType={setMessageType}
            />
          )}

          {/* Chat panel */}
          {activePanel === "chat" && (
            <div>
              <H2>Meldinger</H2>
            </div>
          )}

          {/* Safehouse panel */}
          {activePanel === "hq" && (
            <div className="flex flex-wrap gap-2 md:gap-4">
              <div className="w-full">
                <H2>Hovedkvarter</H2>
              </div>

              <div className="flex-grow">
                <Box>
                  <H3>Hendelser</H3>

                  <ul className="mb-4">
                    {sortedEvents.map((familyEvent, index) => (
                      <li
                        key={"event" + index}
                        className="flex justify-between gap-4 text-sm"
                      >
                        {familyEvent.type === "created" ? (
                          <p>
                            Familien ble opprettet av{" "}
                            <Username
                              character={{
                                id: familyEvent.characterId!,
                                username: familyEvent.characterName!,
                              }}
                            />
                            .
                          </p>
                        ) : familyEvent.type === "newMember" ? (
                          <p>
                            <Username
                              character={{
                                id: familyEvent.characterId!,
                                username: familyEvent.characterName!,
                              }}
                            />{" "}
                            ble medlem av familien.
                          </p>
                        ) : familyEvent.type === "kickedMember" ? (
                          <p>
                            <Username
                              character={{
                                id: familyEvent.characterId!,
                                username: familyEvent.characterName!,
                              }}
                            />{" "}
                            ble kastet ut av familien.
                          </p>
                        ) : familyEvent.type === "leftMember" ? (
                          <p>
                            <Username
                              character={{
                                id: familyEvent.characterId!,
                                username: familyEvent.characterName!,
                              }}
                            />{" "}
                            forlot familien.
                          </p>
                        ) : (
                          <p>{familyEvent.type}</p>
                        )}

                        <p>{formatTimestamp(familyEvent.timestamp)}</p>
                      </li>
                    ))}
                  </ul>
                </Box>
              </div>

              <div className="flex-grow">
                <Box>
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
                      <Button onClick={deposit}>Doner</Button>
                      <Button onClick={withdraw}>Ta ut</Button>
                    </div>
                  </form>
                </Box>
              </div>
            </div>
          )}

          {/* Profile panel */}
          {activePanel === "profile" && (
            <div>
              <FamilyProfile family={family} />
            </div>
          )}

          {/* Applications panel */}
          {activePanel === "applications" && (
            <FamilyApplications
              setMessage={setMessage}
              setMessageType={setMessageType}
              applications={applications}
              setApplications={setApplications}
            />
          )}

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
