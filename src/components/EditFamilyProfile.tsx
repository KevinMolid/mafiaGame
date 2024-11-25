import { useState } from "react";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useCharacter } from "../CharacterContext";

const EditFamilyProfile = () => {
  const { userCharacter } = useCharacter();
  const [imgUrl, setimgUrl] = useState(userCharacter ? userCharacter.img : "");
  const [profileTxt, setProfileTxt] = useState(
    userCharacter ? userCharacter.profileText : ""
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info"
  >("info");

  const handleImgChange = (e: any) => {
    setimgUrl(e.target.value);
  };

  const handleProfileTxtChange = (e: any) => {
    setProfileTxt(e.target.value);
  };

  const updateProfile = async () => {
    if (!userCharacter || !userCharacter.familyId) {
      return;
    }

    try {
      // Reference to the family's document in Firestore
      const familyRef = doc(db, "Families", userCharacter.familyId);

      // Update Profile Img in Firestore
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

  return (
    <section>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <form action="" className="flex flex-col gap-4 mb-4">
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
            name=""
            id="profileTxt"
            className="bg-neutral-800 px-2 py-1 resize-none"
            value={profileTxt}
            onChange={handleProfileTxtChange}
          ></textarea>
        </div>
      </form>

      <Button onClick={updateProfile}>Oppdater</Button>
    </section>
  );
};

export default EditFamilyProfile;
