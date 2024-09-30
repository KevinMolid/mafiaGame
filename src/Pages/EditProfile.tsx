import { useState } from "react";

import H1 from "../components/Typography/H1";
import Button from "../components/Button";

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

const EditProfile = () => {
  const { userData } = useAuth();
  const { character } = useCharacter();
  const [imgUrl, setimgUrl] = useState(character ? character.img : "");

  const handleImgChange = (e: any) => {
    setimgUrl(e.target.value);
  };

  const setProfileImg = async () => {
    try {
      // Reference to the player's document in Firestore
      const characterRef = doc(db, "Characters", userData.activeCharacter);

      // Update Profile Img in Firestore
      await updateDoc(characterRef, {
        img: imgUrl,
      });
    } catch (error) {
      console.error("Error updating img:", error);
    }
    setimgUrl("");
  };

  return (
    <section>
      <H1>Edit profile</H1>
      <form action="" className="mb-4">
        <div className="flex flex-col">
          <label htmlFor="profileImg">Profile Image</label>
          <input
            className="bg-neutral-800 px-2 py-1"
            id="profileImg"
            type="text"
            value={imgUrl}
            onChange={handleImgChange}
          />
        </div>
      </form>
      <Button onClick={setProfileImg}>Set profile image</Button>
    </section>
  );
};

export default EditProfile;
