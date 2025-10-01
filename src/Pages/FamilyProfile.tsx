// Components
import Main from "../components/Main";
import Username from "../components/Typography/Username";
import H3 from "../components/Typography/H3";

// Functions
import { bbcodeToHtml } from "../Functions/bbcode";

// React
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Firebase
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FamilyProfile = () => {
  const { familieID } = useParams<{ familieID: string }>();
  const [familyData, setFamilyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacterData = async () => {
      if (!familieID) {
        setError("Family ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const charDocRef = doc(db, "Families", familieID);
        const charDocSnap = await getDoc(charDocRef);
        if (charDocSnap.exists()) {
          setFamilyData(charDocSnap.data());
        } else {
          setError("Familien ble ikke funnet!");
        }
      } catch (err) {
        console.error("Feil ved lasting av familie:", err);
        setError("Feil ved lasting av familie.");
      } finally {
        setLoading(false);
      }
    };

    if (familieID) {
      fetchCharacterData();
    }
  }, [familieID]);

  if (loading) {
    return <Main>Laster familie...</Main>;
  }

  if (error) {
    return <Main>{error}</Main>;
  }

  if (!familyData) {
    return <div>Familie ikke tilgjengelig.</div>;
  }

  return (
    <Main>
      <div className="flex flex-col items-center lg:grid lg:grid-cols-[max-content_max-content] gap-4 lg:gap-8 pb-4 border-b border-neutral-700">
        <img
          className="w-[320px] h-[320px] object-cover"
          src={familyData.img || "/FamilyDefault.jpg"}
          alt={`${familyData.name} profilbilde`}
        />

        <div className="flex flex-col h-full justify-between gap-4">
          {/* Info */}
          <H3>{familyData.name}</H3>
          <ul className="grid grid-cols-[min-content_max-content] gap-x-4">
            <li>Leder:</li>
            <li>
              <Username
                character={{
                  id: familyData.leaderId,
                  username: familyData.leaderName,
                }}
              />
            </li>
            <li>
              <p>Medlemmer:</p>
            </li>
            <li>
              {" "}
              <ul>
                {familyData.members.map(
                  (member: { id: string; name: string; rank: string }) => {
                    if (member.rank != "Boss") {
                      return (
                        <li key={member.id}>
                          <Username
                            character={{
                              id: member.id,
                              username: member.name,
                            }}
                          />
                        </li>
                      );
                    }
                  }
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Profiletext */}
      <div className="py-6">
        <div className="bg-neutral-900 border border-neutral-700 rounded-md p-4 break-words">
          {familyData?.profileText?.length ? (
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: bbcodeToHtml(familyData.profileText),
              }}
            />
          ) : (
            <span className="text-neutral-500">Ingen profiltekst ennå.</span>
          )}
        </div>
      </div>
    </Main>
  );
};

export default FamilyProfile;
