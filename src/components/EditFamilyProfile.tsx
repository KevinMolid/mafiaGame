import { useEffect, useState } from "react";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

import { getFirestore, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useCharacter } from "../CharacterContext";

const EditFamilyProfile = () => {
  const { userCharacter } = useCharacter();

  const [imgUrl, setImgUrl] = useState("");
  const [profileTxt, setProfileTxt] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info"
  >("info");

  const [loading, setLoading] = useState(true);

  // Load family data (img, profileText) and keep in sync
  useEffect(() => {
    if (!userCharacter?.familyId) {
      setLoading(false);
      setMessage("Du er ikke medlem av en familie.");
      setMessageType("info");
      return;
    }

    const familyRef = doc(db, "Families", userCharacter.familyId);
    const unsub = onSnapshot(
      familyRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { img?: string; profileText?: string };
          setImgUrl(data.img || "");
          setProfileTxt(data.profileText || "");
          setMessage("");
        } else {
          setMessage("Familien ble ikke funnet.");
          setMessageType("failure");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading family:", err);
        setMessage("Kunne ikke laste familie.");
        setMessageType("failure");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userCharacter?.familyId]);

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImgUrl(e.target.value);
  };

  const handleProfileTxtChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setProfileTxt(e.target.value);
  };

  const updateProfile = async () => {
    if (!userCharacter?.familyId) return;

    try {
      const familyRef = doc(db, "Families", userCharacter.familyId);
      await updateDoc(familyRef, {
        img: imgUrl,
        profileText: profileTxt,
      });

      setMessage("Profilen ble oppdatert!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Det skjedde en feil under oppdatering av profilen!");
      setMessageType("failure");
    }
  };

  if (loading) {
    return <section>Henter familie...</section>;
  }

  return (
    <section>
      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <form
        className="flex flex-col gap-4 mb-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <label htmlFor="profileImg">Profilbilde</label>
          <input
            className="bg-neutral-800 px-2 py-1"
            id="profileImg"
            type="text"
            value={imgUrl}
            onChange={handleImgChange}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="profileTxt">Profiltekst</label>
          <textarea
            rows={8}
            id="profileTxt"
            className="bg-neutral-800 px-2 py-1 resize-none"
            value={profileTxt}
            spellCheck={false}
            onChange={handleProfileTxtChange}
          />
        </div>
      </form>

      <Button onClick={updateProfile} disabled={!userCharacter?.familyId}>
        Oppdater
      </Button>
    </section>
  );
};

export default EditFamilyProfile;
