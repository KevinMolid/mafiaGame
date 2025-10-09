import { useState, useRef, useEffect, Fragment } from "react";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

// Components
import H2 from "./Typography/H2";
import H3 from "./Typography/H3";
import InfoBox from "./InfoBox";
import Username from "./Typography/Username";
import Box from "./Box";
import Button from "./Button";

import { Application } from "../Pages/Family";

// Context
import { useCharacter } from "../CharacterContext";

interface FamilyApplicationsInterface {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
}

type Invitation = {
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

const FamilyApplications = ({
  applications,
  setApplications,
}: FamilyApplicationsInterface) => {
  const { userCharacter } = useCharacter();
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  // --- Invite state ---
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const [inviteMsg, setInviteMsg] = useState<React.ReactNode>("");
  const [inviteMsgType, setInviteMsgType] = useState<
    "info" | "success" | "failure" | "warning"
  >("info");

  // --- Invites list state ---
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState<boolean>(true);

  const norm = (s: string) => s.trim().toLowerCase();

  useEffect(() => {
    if (!userCharacter?.familyId) return;
    setInvitesLoading(true);

    // 1) Keep the query simple to avoid composite index requirement.
    const qInv = query(
      collection(db, "FamilyInvites"),
      where("familyId", "==", userCharacter.familyId),
      where("status", "==", "pending")
      // orderBy removed — sort locally below
    );

    const unsub = onSnapshot(
      qInv,
      (snap) => {
        // 2) Map + client-side sort by createdAt desc, handling missing timestamps.
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setInvites(rows);
        setInvitesLoading(false);
      },
      (err) => {
        console.error("FamilyInvites listener error:", err);
        setInvites([]); // ensure UI shows empty with error
        setInvitesLoading(false);
      }
    );

    return unsub;
  }, [db, userCharacter?.familyId]);

  const formatDate = (d?: Date | Timestamp) => {
    const date = d instanceof Timestamp ? d.toDate() : d;
    if (!date) return "-";
    return new Intl.DateTimeFormat("no-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
      .format(date)
      .replace(" kl.", " kl.");
  };

  // --- INVITE HANDLER ---
  const handleInvite = async () => {
    if (!userCharacter?.familyId || !userCharacter?.familyName) {
      setInviteMsgType("failure");
      setInviteMsg("Du må være i en familie for å invitere.");
      return;
    }

    const uname = inviteUsername.trim();
    if (!uname) {
      setInviteMsgType("warning");
      setInviteMsg("Skriv inn brukernavn.");
      inviteInputRef.current?.focus();
      return;
    }
    if (norm(uname) === norm(userCharacter.username || "")) {
      setInviteMsgType("warning");
      setInviteMsg("Du kan ikke invitere deg selv.");
      inviteInputRef.current?.focus();
      return;
    }

    setInviting(true);
    try {
      // 1) Find player by username / usernameLower
      let snap = await getDocs(
        query(collection(db, "Characters"), where("username", "==", uname))
      );
      if (snap.empty) {
        snap = await getDocs(
          query(
            collection(db, "Characters"),
            where("username_lowercase", "==", uname.toLowerCase())
          )
        );
      }
      if (snap.empty) {
        setInviteMsgType("failure");
        setInviteMsg(`Fant ingen spiller med brukernavn «${uname}».`);
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

      // 2) Block if already in a family
      if (invitedData.familyId) {
        setInviteMsgType("warning");
        setInviteMsg(
          `${invitedData.username || uname} er allerede i en familie.`
        );
        return;
      }

      // 3) FAST GUARD: check current in-memory pending invites list
      const hasPendingInState = invites.some(
        (i) => i.invitedId === invitedId && i.status === "pending"
      );

      if (hasPendingInState) {
        setInviteMsgType("info");
        setInviteMsg(
          <p>
            Det finnes allerede en invitasjon til{" "}
            <Username
              useParentColor
              character={{
                id: invitedId,
                username: invitedData.username || uname,
              }}
            />
            .
          </p>
        );
        return;
      }

      // 4) HARD GUARD: query Firestore to avoid race conditions / stale state
      const dupSnap = await getDocs(
        query(
          collection(db, "FamilyInvites"),
          where("familyId", "==", userCharacter.familyId),
          where("invitedId", "==", invitedId),
          where("status", "==", "pending")
        )
      );
      if (!dupSnap.empty) {
        setInviteMsgType("info");
        setInviteMsg(
          `Det finnes allerede en ventende invitasjon til ${
            invitedData.username || uname
          }.`
        );
        return;
      }

      // 5) Create invite
      await addDoc(collection(db, "FamilyInvites"), {
        familyId: userCharacter.familyId,
        familyName: userCharacter.familyName,
        invitedId,
        invitedName: invitedData.username || uname,
        inviterId: userCharacter.id,
        inviterName: userCharacter.username,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 6) Log event
      const familyRef = doc(db, "Families", userCharacter.familyId);
      await addDoc(collection(familyRef, "Events"), {
        type: "inviteSent",
        invitedId,
        invitedName: invitedData.username || uname,
        inviterId: userCharacter.id,
        inviterName: userCharacter.username,
        timestamp: serverTimestamp(),
      });

      setInviteMsgType("success");
      setInviteMsg(
        <p>
          Invitasjon sendt til{" "}
          <Username
            useParentColor
            character={{
              id: invitedId,
              username: invitedData.username || uname,
            }}
          />
          !
        </p>
      );
      setInviteUsername("");
    } catch (err) {
      console.error(err);
      setInviteMsgType("failure");
      setInviteMsg("Kunne ikke sende invitasjon. Prøv igjen.");
    } finally {
      setInviting(false);
    }
  };

  // --- Revoke invite ---
  const revokeInvite = async (invite: Invitation) => {
    if (!userCharacter?.familyId) return;
    try {
      await deleteDoc(doc(db, "FamilyInvites", invite.id));
      const familyRef = doc(db, "Families", userCharacter.familyId);
      await addDoc(collection(familyRef, "Events"), {
        type: "inviteRevoked",
        invitedId: invite.invitedId,
        invitedName: invite.invitedName,
        inviterId: userCharacter.id,
        inviterName: userCharacter.username,
        timestamp: serverTimestamp(),
      });
      setInviteMsgType("info");
      setInviteMsg(
        <p>
          Invitasjonen til{" "}
          <Username
            useParentColor
            character={{ id: invite.invitedId, username: invite.invitedName }}
          />{" "}
          ble trukket tilbake.
        </p>
      );
    } catch (e) {
      console.error(e);
      setError("Kunne ikke trekke tilbake invitasjonen.");
    }
  };

  // --- ACCEPT APPLICATION ---
  const acceptApplication = async (application: Application) => {
    if (!userCharacter?.familyId || !userCharacter?.familyName) return;

    try {
      // Notify applicant
      const alertRef = doc(
        db,
        "Characters",
        application.applicantId,
        "alerts",
        `AcceptedToFamily_${userCharacter.familyId}`
      );
      await setDoc(alertRef, {
        type: "applicationAccepted",
        familyName: userCharacter.familyName,
        familyId: userCharacter.familyId,
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update applicant's character
      const applicantCharacterRef = doc(
        db,
        "Characters",
        application.applicantId
      );
      await updateDoc(applicantCharacterRef, {
        familyId: userCharacter.familyId,
        familyName: userCharacter.familyName,
        activeFamilyApplication: null,
      });

      // Add member + add TWO events (structured + readable text)
      const familyRef = doc(db, "Families", userCharacter.familyId);

      // 1) Add member to the family doc
      await updateDoc(familyRef, {
        members: arrayUnion({
          id: application.applicantId,
          name: application.applicantUsername,
          rank: "Member",
        }),
      });

      // 2) Add events to subcollection
      await addDoc(collection(familyRef, "Events"), {
        type: "newMember",
        characterId: application.applicantId,
        characterName: application.applicantUsername,
        timestamp: serverTimestamp(),
      });

      // Remove application
      const applicationRef = doc(
        db,
        "Families",
        userCharacter.familyId,
        "Applications",
        application.documentId
      );
      await deleteDoc(applicationRef);

      // UI updates
      setApplications((prev) =>
        prev.filter((app) => app.documentId !== application.documentId)
      );

      setInviteMsgType("success");
      setInviteMsg(
        <p>
          Søknaden ble godkjent.{" "}
          <Username
            useParentColor
            character={{
              id: application.applicantId,
              username: application.applicantUsername,
            }}
          />{" "}
          er nå medlem av familien.
        </p>
      );
    } catch (error) {
      console.error("Feil ved godkjenning av søknad:", error);
      setError("Feil ved godkjenning av søknad.");
    }
  };

  // --- DECLINE APPLICATION ---
  const declineApplication = async (application: Application) => {
    if (!userCharacter?.familyId || !userCharacter?.familyName) return;

    try {
      const alertRef = doc(
        db,
        "Characters",
        application.applicantId,
        "alerts",
        `DeclinedFromFamily_${userCharacter.familyId}`
      );
      await setDoc(alertRef, {
        type: "applicationDeclined",
        familyName: userCharacter.familyName,
        familyId: userCharacter.familyId,
        timestamp: serverTimestamp(),
        read: false,
      });

      const applicantCharacterRef = doc(
        db,
        "Characters",
        application.applicantId
      );
      await updateDoc(applicantCharacterRef, { activeFamilyApplication: null });

      const applicationRef = doc(
        db,
        "Families",
        userCharacter.familyId,
        "Applications",
        application.documentId
      );
      await deleteDoc(applicationRef);

      setApplications((prev) =>
        prev.filter((app) => app.documentId !== application.documentId)
      );
    } catch (error) {
      console.error("Feil ved avslag av søknad:", error);
      setError("Feil ved avslag av søknad.");
    }
  };

  if (error) return <InfoBox type="failure">{error}</InfoBox>;

  return (
    <div>
      <H2>Søknader</H2>

      {inviteMsg && <InfoBox type={inviteMsgType}>{inviteMsg}</InfoBox>}

      {/* APPLICATIONS LIST */}
      {applications.length === 0 ? (
        <p className="mb-4">Familien har for øyeblikket ingen søknader.</p>
      ) : (
        <ul className="mb-4">
          {applications.map((application) => (
            <li key={application.documentId} className="mb-2">
              <Box>
                <div className="flex gap-x-4 flex-wrap justify-between mb-4">
                  <p>
                    <Username
                      character={{
                        id: application.applicantId,
                        username: application.applicantUsername,
                      }}
                    />
                  </p>
                  <p>{formatDate(application.appliedAt)}</p>
                </div>
                <p>
                  {application.applicationText.split("\n").map((line, idx) => (
                    <Fragment key={idx}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
                </p>

                <div className="flex gap-2 justify-end">
                  <Button onClick={() => acceptApplication(application)}>
                    <i className="fa-solid fa-check"></i> Godta
                  </Button>
                  <Button
                    style="danger"
                    onClick={() => declineApplication(application)}
                  >
                    <i className="fa-solid fa-ban"></i> Avslå
                  </Button>
                </div>
              </Box>
            </li>
          ))}
        </ul>
      )}

      {/* INVITER SPILLER */}
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
              spellCheck={false}
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

      {/* PENDING INVITES LIST */}
      <div className="mt-4">
        <H3>Invitasjoner</H3>
        {invitesLoading ? (
          <p>Laster invitasjoner…</p>
        ) : invites.length === 0 ? (
          <p>Ingen utestående invitasjoner.</p>
        ) : (
          <Box>
            <ul className="mt-2">
              {invites.map((inv) => (
                <li key={inv.id}>
                  <div className="flex gap-2 flex-wrap justify-between max-w-[800px]">
                    <div className="flex flex-col">
                      <span className="opacity-80 text-sm">
                        Invitert spiller
                      </span>
                      <Username
                        character={{
                          id: inv.invitedId,
                          username: inv.invitedName,
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-80 text-sm">Invitert av</span>
                      <Username
                        character={{
                          id: inv.inviterId,
                          username: inv.inviterName,
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-80 text-sm">Sendt</span>
                      <span>{formatDate(inv.createdAt)}</span>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button style="danger" onClick={() => revokeInvite(inv)}>
                        <i className="fa-solid fa-xmark"></i> Trekk tilbake
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </div>
    </div>
  );
};

export default FamilyApplications;
