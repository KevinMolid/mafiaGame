// React
import { useState } from "react";

// Firebase
import { collection, addDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

import H1 from "../components/Typography/H1";
import Button from "../components/Button";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CreateCharacter = () => {
  const [num, setNum] = useState(0);

  async function handleClick() {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        first: "Ada",
        last: "Lovelace",
        born: 1815,
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <>
      <H1>Create character</H1>
      <p>{num}</p>
      <Button onClick={handleClick}>Create character</Button>
    </>
  );
};

export default CreateCharacter;
