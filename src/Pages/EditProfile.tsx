import { useState } from "react";

import H2 from "../components/Typography/H2";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

const EditProfile = () => {
  const { userData } = useAuth();
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
    try {
      // Reference to the player's document in Firestore
      const characterRef = doc(db, "Characters", userData.activeCharacter);

      // Update Profile Img in Firestore
      await updateDoc(characterRef, {
        img: imgUrl,
        profileText: profileTxt,
      });

      setMessage("Profilen ble oppdatert!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Det oppstod en feil under lagring av profilen!");
      setMessageType("failure");
    }
  };

  return (
    <section>
      <H2>Endre profil</H2>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <form action="" className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="profileImg">
            Profilbilde (Anbefalt størrelse: 320 x 320 px)
          </label>
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            id="profileImg"
            type="text"
            value={imgUrl}
            spellCheck={false}
            onChange={handleImgChange}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="profileTxt">Profiltekst</label>
          <textarea
            rows={8}
            name=""
            id="profileTxt"
            className="bg-neutral-900 py-2 border border-neutral-600 px-4 text-white placeholder-neutral-400 w-full resize-none"
            value={profileTxt}
            spellCheck={false}
            onChange={handleProfileTxtChange}
          ></textarea>
        </div>
      </form>

      <Button onClick={updateProfile}>Lagre</Button>
    </section>
  );
};

export default EditProfile;
