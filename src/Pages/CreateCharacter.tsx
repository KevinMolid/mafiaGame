// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Button from "../components/Button";

// React
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

// Context
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

// Firebase
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CreateCharacter = () => {
  const { user, userData, setUserData } = useAuth();
  const { userCharacter, setUserCharacter } = useCharacter();
  const [location, setLocation] = useState<string>("New York");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const cities = [
    "Mexico City",
    "New York",
    "Moskva",
    "Rio de Janeiro",
    "Tokyo",
  ];

  if (
    userData.type !== "admin" &&
    userCharacter &&
    userCharacter.status === "alive"
  ) {
    return <Navigate to="/" />;
  }

  /* Handle username input field */
  function handleUsernameChange(e: any) {
    const value = e.target.value;
    const regex = /^[A-Za-zæÆøØåÅ0-9]*$/;

    if (regex.test(value) && value.length <= 16) {
      setUsername(value);
      setError("");
    } else if (!regex.test(value)) {
      setError("Brukernavnet kan bare inneholde tall og bokstaver.");
    } else if (value.length > 16) {
      setError("Brukernavnet kan ikke være lengre enn 16 tegn.");
    }
  }

  // Check if the username already exists in the "Characters" collection
  async function isUsernameUnique(username: string) {
    const lowercaseUsername = username.toLowerCase();
    const q = query(
      collection(db, "Characters"),
      where("username_lowercase", "==", lowercaseUsername)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty; // Returns true if no documents found
  }

  async function handleClick() {
    // Check that username is at least 3 characters
    if (username.length < 3) {
      setError("Brukernavnet må inneholde minst 3 tegn.");
      return;
    }

    try {
      // Check if the username is unique
      const isUnique = await isUsernameUnique(username);
      if (!isUnique) {
        setError("Brukernavnet finnes allerede.");
        return;
      }

      // Add the new character to the "Characters" collection
      const newCharacterData = {
        uid: user.uid,
        username: username,
        username_lowercase: username.toLowerCase(),
        img: "",
        currentRank: 1,
        status: "alive",
        stats: { xp: 0, hp: 100, heat: 0, bank: 0, money: 1000, protection: 0 },
        reputation: { police: 0, politics: 0, gangs: 0, community: 0 },
        location: location,
        createdAt: serverTimestamp(),
        diedAt: null,
        lastCrimeTimestamp: null,
        profileText: "",
      };

      const docRef = await addDoc(
        collection(db, "Characters"),
        newCharacterData
      );

      // Update the user document in the "Users" collection
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        characters: arrayUnion(docRef.id),
        activeCharacter: docRef.id,
      });

      // Set character in local state
      setUserCharacter({
        id: docRef.id,
        ...newCharacterData,
        createdAt: new Date(),
      });

      // Update user data in local state
      setUserData({
        ...user,
        characters: [...(user.characters || []), docRef.id],
        activeCharacter: docRef.id,
      });

      // Navigate to home page after character is created
      navigate("/");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <Main img="MafiaBg">
      <H1>Opprett ny spillkarakter</H1>
      <form action="" className="flex flex-col mb-4 gap-2">
        <label htmlFor="username">
          <H2>Velg brukernavn</H2>
        </label>
        <input
          className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
          id="username"
          type="text"
          placeholder="Ønsket brukernavn"
          value={username}
          onChange={handleUsernameChange}
        />
        {error && <span className="text-red-500">{error}</span>}

        <H2>Velg hvor du vil starte</H2>
        <ul className="flex gap-2 flex-wrap">
          {cities.map((city) => (
            <li
              key={city}
              className={
                "border px-4 py-2 flex-grow text-center cursor-pointer " +
                (city === location
                  ? "bg-neutral-900 border-neutral-600"
                  : "bg-neutral-800 hover:bg-neutral-700 border-transparent")
              }
              onClick={() => setLocation(city)}
            >
              <p className={city === location ? "text-white" : ""}>{city}</p>
            </li>
          ))}
        </ul>
      </form>
      <Button onClick={handleClick}>Opprett karakter</Button>
    </Main>
  );
};

export default CreateCharacter;
