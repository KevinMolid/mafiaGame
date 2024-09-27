// React
import { useState } from "react";

// Context
import { useAuth } from "../AuthContext";

// Firebase
import { collection, addDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

// Components
import H1 from "../components/Typography/H1";
import Button from "../components/Button";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CreateCharacter = () => {
  const { user, userData } = useAuth();
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
      const docRef = await addDoc(collection(db, "Characters"), {
        uid: user.uid,
        username: username,
        status: "alive",
        stats: { exp: 0, hp: 100 },
        reputation: { police: 0, politics: 0, gangs: 0, community: 0 },
        location: "New York",
        createdAt: new Date(),
        diedAt: null,
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <>
      <H1>Create your character</H1>
      <p>{userData.email}</p>
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
