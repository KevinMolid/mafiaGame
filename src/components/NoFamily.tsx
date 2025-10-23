import H1 from "./Typography/H1";
import H2 from "./Typography/H2";
import InfoBox from "./InfoBox";
import Username from "./Typography/Username";
import Familyname from "./Typography/Familyname";
import Button from "./Button";
import Box from "./Box";

import { useCharacter } from "../CharacterContext";

import { useState, useEffect, Fragment } from "react";
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
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";

const db = getFirestore();

// Interfaces
import { FamilyData } from "../Interfaces/Types";

interface NoFamilyInterface {
  family: FamilyData | null;
  setFamily: React.Dispatch<React.SetStateAction<FamilyData | null>>;
  message: React.ReactNode;
  setMessage: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  messageType: "info" | "success" | "failure" | "warning";
  setMessageType: React.Dispatch<
    React.SetStateAction<"info" | "success" | "failure" | "warning">
  >;
}

// Local type for invites
type Invite = {
  id: string;
  familyId: string;
  familyName: string;
  invitedId: string;
  invitedName: string;
  inviterId: string;
  inviterName: string;
  status: "pending" | "accepted" | "declined" | "revoked";
  createdAt?: Timestamp;
};

const NoFamily = ({
  family,
  setFamily,
  message,
  setMessage,
  messageType,
  setMessageType,
}: NoFamilyInterface) => {
  const [familyName, setFamilyName] = useState("");
  const { userCharacter } = useCharacter();
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationText, setApplicationText] = useState<string>("");

  // NEW: invites state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState<boolean>(true);
  const [invitesError, setInvitesError] = useState<string | null>(null);

  const createFamilyCost = 10_000_000;

  // Fetch all families from Firestore
  useEffect(() => {
    if (!userCharacter || family) return;

    const fetchFamilies = async () => {
      try {
        const familiesSnapshot = await getDocs(collection(db, "Families"));
        const familiesData: FamilyData[] = familiesSnapshot.docs.map(
          (docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FamilyData, "id">),
          })
        );
        setFamilies(familiesData);
      } catch (error) {
        console.error("fetchFamilies error:", error);
        setMessageType("failure");
        setMessage("Feil ved henting av familier.");
      }
    };

    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to pending invites for this user (only when not in a family)
  useEffect(() => {
    if (!userCharacter?.id || family) return;

    setInvitesLoading(true);
    setInvitesError(null);

    const qInv = query(
      collection(db, "FamilyInvites"),
      where("invitedId", "==", userCharacter.id),
      where("status", "==", "pending")
      // no orderBy to avoid composite index requirement
    );

    const unsub = onSnapshot(
      qInv,
      (snap) => {
        const rows: Invite[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Invite, "id">) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta; // newest first
          });
        setInvites(rows);
        setInvitesLoading(false);
      },
      (err) => {
        console.error("Invites listener error:", err);
        setInvitesError("Kunne ikke hente invitasjoner.");
        setInvites([]);
        setInvitesLoading(false);
      }
    );

    return unsub;
  }, [family, userCharacter?.id]);

  const isValidFamilyName = (name: string): boolean => {
    const regex = /^(?! )[A-Za-z0-9 æÆøØåÅ]{3,30}(?<! )$/u;
    return regex.test(name) && !/ {2,}/.test(name);
  };

  // Create new family (clean model: Events as subcollection)
  const createFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userCharacter) return;

    if (!familyName.trim()) {
      setMessageType("warning");
      setMessage("Du må skrive inn ønsket familienavn.");
      return;
    }

    if (!isValidFamilyName(familyName)) {
      setMessageType("warning");
      setMessage(
        "Familienavn må være mellom 3 og 30 tegn, kan ikke starte eller slutte med mellomrom, og kan ikke ha flere mellomrom etter hverandre."
      );
      return;
    }

    const cost = createFamilyCost;
    if (userCharacter.stats.money < cost) {
      setMessageType("warning");
      setMessage("Du har ikke nok penger til å opprette familie.");
      return;
    }

    try {
      const lowerCaseName = familyName.toLowerCase();
      const existingFamily = families.find(
        (fam) => fam.name.toLowerCase() === lowerCaseName
      );

      if (existingFamily) {
        setMessageType("warning");
        setMessage("En familie med dette navnet eksisterer allerede.");
        return;
      }

      const familyDocRef = await addDoc(collection(db, "Families"), {
        name: familyName,
        leaderName: userCharacter.username,
        leaderId: userCharacter.id,
        members: [
          {
            id: userCharacter.id,
            name: userCharacter.username,
            rank: "Boss",
          },
        ],
        createdAt: serverTimestamp(),
        rules: "",
        img: "",
        profileText: "",
        wealth: 0,
      });

      const familyId = familyDocRef.id;

      await addDoc(collection(familyDocRef, "Events"), {
        type: "created",
        characterId: userCharacter.id,
        characterName: userCharacter.username,
        timestamp: serverTimestamp(),
      });

      const newMoneyValue = userCharacter.stats.money - cost;
      const characterRef = doc(db, "Characters", userCharacter.id);
      await setDoc(
        characterRef,
        {
          familyId: familyId,
          familyName: familyName,
          stats: { money: newMoneyValue },
        },
        { merge: true }
      );

      await addDoc(collection(db, "GameEvents"), {
        eventType: "newFamily",
        familyId: familyId,
        familyName: familyName,
        leaderId: userCharacter.id,
        leaderName: userCharacter.username,
        timestamp: serverTimestamp(),
      });

      setFamily({
        id: familyId,
        name: familyName,
        leaderName: userCharacter.username,
        leaderId: userCharacter.id,
        members: [
          { id: userCharacter.id, name: userCharacter.username, rank: "Boss" },
        ],
        createdAt: new Date(),
        rules: "",
        img: "",
        profileText: "",
        wealth: 0,
        events: [],
      } as FamilyData);

      setFamilyName("");
      setMessageType("success");
      setMessage(`Du opprettet ${familyName} for $${cost.toLocaleString()}.`);
    } catch (error) {
      console.error("createFamily error:", error);
      setMessageType("failure");
      setMessage("Feil ved opprettelse av familie.");
    }
  };

  const handleApplicationTextChange = (e: any) => {
    setApplicationText(e.target.value);
  };

  const sendApplication = async (familyName: string) => {
    if (!userCharacter || !familyName) return;

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
        applicantId: userCharacter.id,
        applicantUsername: userCharacter.username,
        applicationText: applicationText,
        appliedAt: new Date(),
      });

      const characterRef = doc(db, "Characters", userCharacter.id);
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

  const cancelApplication = async () => {
    if (!userCharacter) return;
    if (!userCharacter.activeFamilyApplication) return;

    try {
      const { familyId, applicationId } = userCharacter.activeFamilyApplication;

      const applicationDocRef = doc(
        db,
        "Families",
        familyId,
        "Applications",
        applicationId
      );
      await deleteDoc(applicationDocRef);

      const characterRef = doc(db, "Characters", userCharacter.id);
      await updateDoc(characterRef, {
        activeFamilyApplication: deleteField(),
      });

      setMessageType("success");
      setMessage("Søknaden ble avbrutt.");
    } catch (error) {
      console.error("Error cancelling application:", error);
      setMessageType("failure");
      setMessage("Feil ved avbryting av søknad.");
    }
  };

  // Helpers
  const fmt = (ts?: Timestamp) =>
    ts
      ? ts
          .toDate()
          .toLocaleString("no-NO", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(" kl.", " kl.")
      : "-";

  // Actions: accept / decline invite
  const acceptInvite = async (invite: Invite) => {
    if (!userCharacter) return;

    try {
      // 1) Add to family members + event
      const familyRef = doc(db, "Families", invite.familyId);
      await updateDoc(familyRef, {
        members: arrayUnion({
          id: userCharacter.id,
          name: userCharacter.username,
          rank: "Member",
        }),
      });
      await addDoc(collection(familyRef, "Events"), {
        type: "newMember",
        characterId: userCharacter.id,
        characterName: userCharacter.username,
        timestamp: serverTimestamp(),
      });

      // 2) Update character with family
      const characterRef = doc(db, "Characters", userCharacter.id);
      await updateDoc(characterRef, {
        familyId: invite.familyId,
        familyName: invite.familyName,
        activeFamilyApplication: deleteField(),
      });

      // 3) Remove (or mark) invite
      await deleteDoc(doc(db, "FamilyInvites", invite.id));

      setMessageType("success");
      setMessage(`Du ble med i ${invite.familyName}.`);
      // Optional: Optimistic setFamily to immediately hide this screen
      setFamily({
        id: invite.familyId,
        name: invite.familyName,
        leaderId: "", // will be filled by Family screen fetch
        leaderName: "",
        members: [], // Family screen can load full members list
        createdAt: new Date(),
        rules: "",
        img: "",
        profileText: "",
        wealth: 0,
        events: [],
      } as FamilyData);
    } catch (e) {
      console.error("acceptInvite error:", e);
      setMessageType("failure");
      setMessage("Klarte ikke å godta invitasjonen.");
    }
  };

  const declineInvite = async (invite: Invite) => {
    try {
      await deleteDoc(doc(db, "FamilyInvites", invite.id));
      // Optional: log to family events
      await addDoc(collection(doc(db, "Families", invite.familyId), "Events"), {
        type: "inviteDeclined",
        characterId: invite.invitedId,
        characterName: invite.invitedName,
        inviterId: invite.inviterId,
        inviterName: invite.inviterName,
        timestamp: serverTimestamp(),
      });
      setMessageType("info");
      setMessage(`Du avslo invitasjonen fra ${invite.familyName}.`);
    } catch (e) {
      console.error("declineInvite error:", e);
      setMessageType("failure");
      setMessage("Klarte ikke å avslå invitasjonen.");
    }
  };

  if (family) return null;

  return (
    <>
      <H1>Familie</H1>
      <p className="mb-2">Du tilhører ingen familie.</p>
      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <div className="flex flex-col gap-4">
        {/* Create family */}
        {!applyingTo && !userCharacter?.activeFamilyApplication && (
          <Box>
            <H2>Opprett ny familie</H2>
            <p className="mb-2">
              Kostnad:{" "}
              <strong className="text-yellow-400">
                <i className="fa-solid fa-dollar-sign"></i>{" "}
                {createFamilyCost.toLocaleString("NO-nb")}
              </strong>
            </p>
            <form
              action=""
              onSubmit={createFamily}
              className="flex flex-col gap-2"
            >
              <input
                className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                type="text"
                value={familyName}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length <= 30 && /^[A-Za-z0-9 æÆøØåÅ]*$/u.test(v)) {
                    setFamilyName(v);
                  }
                }}
                placeholder="Familienavn"
              />
              <div>
                <Button type="submit">Opprett familie</Button>
              </div>
            </form>
          </Box>
        )}

        {/* Apply to family */}
        {!applyingTo && !userCharacter?.activeFamilyApplication && (
          <Box>
            <H2>Bli med i en familie</H2>
            {families.length > 0 ? (
              <ul>
                {families.map((fam) => (
                  <li
                    key={fam.name}
                    className="mb-4 flex justify-between items-center"
                  >
                    <div>
                      <p>
                        <Familyname family={fam}></Familyname>
                      </p>
                      <p>
                        Leder:{" "}
                        <Username
                          character={{
                            id: fam.leaderId,
                            username: fam.leaderName,
                          }}
                        />
                      </p>
                    </div>

                    <div>
                      <Button onClick={() => setApplyingTo(fam.name)}>
                        Skriv søknad
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Det finnes ingen familier.</p>
            )}
          </Box>
        )}

        {/* NEW: Invites box (right below “Bli med i en familie”) */}
        {!applyingTo && !userCharacter?.activeFamilyApplication && (
          <Box>
            <H2>Invitasjoner</H2>
            {invitesLoading ? (
              <p>Laster invitasjoner…</p>
            ) : invitesError ? (
              <InfoBox type="failure">{invitesError}</InfoBox>
            ) : invites.length === 0 ? (
              <p>Du har ingen invitasjoner.</p>
            ) : (
              <ul className="mt-2">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="mb-4 flex justify-between items-start gap-4"
                  >
                    <div>
                      <p className="mb-1">
                        <span className="opacity-80">Familie: </span>
                        <Familyname
                          family={{ id: inv.familyId, name: inv.familyName }}
                        />
                      </p>
                      <p className="mb-1">
                        <span className="opacity-80">Invitert av: </span>
                        <Username
                          character={{
                            id: inv.inviterId,
                            username: inv.inviterName,
                          }}
                        />
                      </p>
                      <small className="opacity-70">
                        Sendt {fmt(inv.createdAt)}
                      </small>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button onClick={() => acceptInvite(inv)}>
                        <i className="fa-solid fa-check"></i> Godta
                      </Button>
                      <Button style="danger" onClick={() => declineInvite(inv)}>
                        <i className="fa-solid fa-ban"></i> Avslå
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Box>
        )}

        {/* Application */}
        {applyingTo && (
          <Box>
            <div className="flex justify-between items-baseline mb-2">
              <H2>Søknad til {applyingTo}</H2>
              <button
                className="flex justify-center items-center gap-1  hover:text-neutral-200 px-2 py-1"
                onClick={() => setApplyingTo(null)}
              >
                <i className="fa-solid fa-xmark"></i> Avbryt
              </button>
            </div>
            <form action="" className="flex flex-col gap-2">
              <textarea
                rows={8}
                id="profileTxt"
                placeholder="Søknadstekst"
                className="bg-transparent text-white placeholder-neutral-400 w-full resize-none"
                value={applicationText}
                onChange={handleApplicationTextChange}
              />
              <div className="flex justify-end">
                <Button onClick={() => sendApplication(applyingTo)}>
                  Send søknad
                </Button>
              </div>
            </form>
          </Box>
        )}

        {userCharacter?.activeFamilyApplication && (
          <Box>
            <H2>Venter på godkjenning</H2>
            <p className="mb-4">
              Du sendte en søknad til{" "}
              <Familyname
                family={{
                  id: userCharacter.activeFamilyApplication.familyId,
                  name: userCharacter.activeFamilyApplication.familyName,
                }}
              />
              {" den "}
              {userCharacter.activeFamilyApplication.appliedAt &&
                `${userCharacter.activeFamilyApplication.appliedAt
                  .toDate()
                  .toLocaleDateString("no-NO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })} kl. ${userCharacter.activeFamilyApplication.appliedAt
                  .toDate()
                  .toLocaleTimeString("no-NO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}.`}
            </p>
            {userCharacter.activeFamilyApplication.applicationText && (
              <p className="mb-4 text-neutral-200">
                {userCharacter.activeFamilyApplication.applicationText
                  .split("\n")
                  .map((line, index) => (
                    <Fragment key={index}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
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
