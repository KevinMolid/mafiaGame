// React
import { useState } from "react";

// Firebaase
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

import firebaseConfig from "../firebaseConfig";

// Components
import H1 from "../components/Typography/H1";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Login = () => {
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* Handle input fields */
  function handleEmailChange(event: any) {
    setEmail(event.target.value);
  }

  function handlePwChange(event: any) {
    setPassword(event.target.value);
  }

  /* Handle sign in */
  function signUp(event: any) {
    event.preventDefault();

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user;
        console.log("Logged in as " + user);

        // Add user to db
        return setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          uid: user.uid,
          createdAt: new Date(),
          activeCharacter: null,
          characters: [],
        });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  }

  return (
    <>
      <H1>Log in / Sign up</H1>
      <form action="" className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label htmlFor="email">Email</label>
          <input
            className="bg-neutral-800 px-2 py-1"
            id="email"
            type="text"
            onChange={handleEmailChange}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="pw">Password</label>
          <input
            className="bg-neutral-800 px-2 py-1"
            id="pw"
            type="password"
            onChange={handlePwChange}
          />
        </div>
        <button className="bg-neutral-950 p-2" onClick={signUp}>
          Sign up
        </button>
      </form>
    </>
  );
};

export default Login;
