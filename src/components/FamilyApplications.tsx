import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// Components
import H2 from "./Typography/H2";
import InfoBox from "./InfoBox";
import Username from "./Typography/Username";
import Box from "./Box";
import Button from "./Button";

// Context
import { useCharacter } from "../CharacterContext";

interface Application {
  documentId: string;
  applicantId: string;
  applicantUsername: string;
  applicationText: string;
  appliedAt: Date;
}

const FamilyApplications = () => {
  const { character } = useCharacter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    if (!character?.familyId) return;

    const fetchApplications = async () => {
      if (!character.familyId) {
        return;
      }
      setLoading(true);
      try {
        const applicationsRef = collection(
          db,
          "Families",
          character.familyId,
          "Applications"
        );
        const applicationsSnapshot = await getDocs(applicationsRef);
        const applicationsList: Application[] = applicationsSnapshot.docs.map(
          (doc) => ({
            documentId: doc.id,
            applicantId: doc.data().applicantId,
            applicantUsername: doc.data().applicantUsername,
            applicationText: doc.data().applicationText,
            appliedAt: doc.data().appliedAt?.toDate(),
          })
        );
        setApplications(applicationsList);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Error fetching applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [character?.familyId, db]);

  const formatAppliedAt = (appliedAt: Date) => {
    return new Intl.DateTimeFormat("no-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
      .format(appliedAt)
      .replace(" kl.", " kl.");
  };

  const acceptApplication = async (application: Application) => {
    if (!character?.familyId || !character?.familyName) return;

    try {
      // 1. Add an alert to the applicant's Alerts subcollection
      const alertRef = doc(
        db,
        "Characters",
        application.applicantId,
        "alerts",
        `AcceptedToFamily_${character.familyId}`
      );
      await setDoc(alertRef, {
        type: "applicationAccepted",
        familyName: character.familyName,
        familyId: character.familyId,
        timestamp: serverTimestamp(),
        read: false,
      });

      // 2. Update applicant's character document with familyId and familyName
      const applicantCharacterRef = doc(
        db,
        "Characters",
        application.applicantId
      );
      await updateDoc(applicantCharacterRef, {
        familyId: character.familyId,
        familyName: character.familyName,
        activeFamilyApplication: null,
      });

      // 3. Add applicant to the family's members array
      const familyRef = doc(db, "Families", character.familyId);
      await updateDoc(familyRef, {
        members: arrayUnion({
          id: application.applicantId,
          name: application.applicantUsername,
          rank: "Member", // Set an appropriate rank for the new member
        }),
      });

      // Remove the application after acceptance
      const applicationRef = doc(
        db,
        "Families",
        character.familyId,
        "Applications",
        application.documentId
      );
      await deleteDoc(applicationRef);

      // Refresh applications after acceptance
      setApplications((prev) =>
        prev.filter((app) => app.documentId !== application.documentId)
      );
    } catch (error) {
      console.error("Feil ved godkjenning av søknad:", error);
      setError("Feil ved godkjenning av søknad.");
    }
  };

  // Function to decline application
  const declineApplication = async (application: Application) => {
    if (!character?.familyId || !character?.familyName) return;

    try {
      // 1. Add an alert to the applicant's Alerts subcollection
      const alertRef = doc(
        db,
        "Characters",
        application.applicantId,
        "alerts",
        `DeclinedFromFamily_${character.familyId}`
      );
      await setDoc(alertRef, {
        type: "applicationDeclined",
        familyName: character.familyName,
        familyId: character.familyId,
        timestamp: new Date(),
        read: false,
      });

      // 2. Update applicant's character document with familyId and familyName
      const applicantCharacterRef = doc(
        db,
        "Characters",
        application.applicantId
      );
      await updateDoc(applicantCharacterRef, {
        activeFamilyApplication: null,
      });

      // Remove the application after acceptance
      const applicationRef = doc(
        db,
        "Families",
        character.familyId,
        "Applications",
        application.documentId
      );
      await deleteDoc(applicationRef);

      // Refresh applications after acceptance
      setApplications((prev) =>
        prev.filter((app) => app.documentId !== application.documentId)
      );
    } catch (error) {
      console.error("Feil ved avslag av søknad:", error);
      setError("Feil ved avslag av søknad.");
    }
  };

  if (loading) return <p>Laster søknader...</p>;
  if (error) return <InfoBox type="failure">{error}</InfoBox>;

  return (
    <div>
      <H2>Søknader</H2>
      {applications.length === 0 ? (
        <p>Familien har ingen søknader.</p>
      ) : (
        <ul>
          {applications.map((application) => {
            return (
              <li key={application.documentId}>
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
                    <p>{formatAppliedAt(application.appliedAt)}</p>
                  </div>

                  <p>{application.applicationText}</p>

                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => acceptApplication(application)}>
                      <i className="fa-regular fa-circle-check"></i> Godta
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
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FamilyApplications;
