import { useState } from "react";

import H1 from "../components/Typography/H1";
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

      setMessage("Your profile page was successfully updated!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("There was an error while updating your profile page!");
      setMessageType("failure");
    }
  };

  return (
    <section>
      <H1>Endre profil</H1>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <form action="" className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="profileImg">
            Profilbilde (Anbefalt størrelse: 300 x 300 px)
          </label>
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

      <Button onClick={updateProfile}>Lagre</Button>
    </section>
  );
};

export default EditProfile;
