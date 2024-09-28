// React
import { useState } from "react";

// Context
import { useAuth } from "../AuthContext";

// Firebase
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Components
import H1 from "../components/Typography/H1";
import Button from "../components/Button";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CreateCharacter = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  /* Handle username input field */
  function handleUsernameChange(e: any) {
    const value = e.target.value;
    const regex = /^[A-Za-z]*$/;

    if (regex.test(value) && value.length <= 16) {
      setUsername(value);
      setError("");
    } else if (!regex.test(value)) {
      setError("Username can only contain letters.");
    } else if (value.length > 16) {
      setError("Username must be 16 characters or less.");
    }
  }

  async function handleClick() {
    // Check that username is at least 3 characters
    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    try {
      // Add the new character to the "Characters" collection
      const docRef = await addDoc(collection(db, "Characters"), {
        uid: user.uid,
        username: username,
        status: "alive",
        stats: { xp: 0, hp: 100, heat: 0, money: 1000, protection: 0 },
        reputation: { police: 0, politics: 0, gangs: 0, community: 0 },
        location: "New York",
        createdAt: new Date(),
        diedAt: null,
      });

      // Log the character document ID (REMOVE AT PRODUCTION)
      console.log("Character created with ID: ", docRef.id);

      // Update the user document in the "Users" collection
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        characters: arrayUnion(docRef.id), // Add the new character to the user's characters array
        activeCharacter: docRef.id, // Set the new character as the active character
      });

      console.log(
        "User document updated with new character and active character."
      );
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <>
      <H1>Create your character</H1>
      <form action="" className="flex flex-col mb-4 gap-2">
        <label htmlFor="username">Username</label>
        <input
          className="bg-neutral-800 px-2 py-1"
          id="username"
          type="text"
          value={username}
          onChange={handleUsernameChange}
        />
        {error && <span className="text-red-500">{error}</span>}
      </form>
      <Button onClick={handleClick}>Create character</Button>
    </>
  );
};

export default CreateCharacter;