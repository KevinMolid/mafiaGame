// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Button from "../components/Button";

// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Firebaase
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

import firebaseConfig from "../firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Signup = () => {
  const auth = getAuth();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (userData) {
      navigate("/");
      return;
    }
  }, [userData, navigate]);

  /* Handle input fields */
  function handleEmailChange(event: any) {
    setEmail(event.target.value);
  }

  function handlePwChange(event: any) {
    setPassword(event.target.value);
  }

  /* Handle sign in */
  function signUp() {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user;

        // Add user to db
        return setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          uid: user.uid,
          createdAt: new Date(),
          activeCharacter: null,
          characters: [],
          type: "player",
        });
      })
      .catch((error) => {
        setError(error.code);
      });
  }

  return (
    <Main img="Mafia">
      <div className="w-5/6 sm:w-2/3 max-w-[500px] flex flex-col relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <small className="bg-neutral-900 px-4 py-2 w-fit rounded-t-xl border-t border-x border-neutral-500">
          v. <strong>Alpha</strong>
        </small>
        <div className="bg-neutral-900/80 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <H1>Sign up</H1>
          <form action="" className="flex flex-col gap-2">
            <div className="flex flex-col">
              <label htmlFor="email">Email</label>
              <input
                className="bg-transparent px-2 py-1 border-b border-neutral-500"
                id="email"
                type="text"
                onChange={handleEmailChange}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="pw">Password</label>
              <input
                className="bg-transparent px-2 py-1 border-b border-neutral-500"
                id="pw"
                type="password"
                onChange={handlePwChange}
              />
            </div>
            {error && <span className="text-red-500">{error}</span>}
          </form>
          <Button onClick={signUp}>Sign up</Button>
          <p className="text-stone-400 text-sm sm:text-base">
            Already have an account?{" "}
            <Link to="/login">
              <span className="text-white hover:underline">Log in here!</span>
            </Link>
          </p>
        </div>
      </div>
    </Main>
  );
};

export default Signup;
