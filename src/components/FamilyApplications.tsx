import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
            documentId: doc.id, // Unique document ID
            applicantId: doc.data().applicantId, // Applicant's ID from the document
            applicantUsername: doc.data().applicantUsername,
            appliedAt: doc.data().appliedAt?.toDate(), // Application timestamp
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

  if (loading) return <p>Laster søknader...</p>;
  if (error) return <InfoBox type="failure">{error}</InfoBox>;

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

  return (
    <div>
      <H2>Søknader</H2>
      {applications.length === 0 ? (
        <p>No applications available.</p>
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
                  <div className="flex gap-2 justify-end">
                    <Button>Godta</Button>
                    <Button style="danger">Avslå</Button>
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
