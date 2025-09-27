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

import { FirebaseError } from "firebase/app";

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

  function getAuthErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as FirebaseError).code;

      const M: Record<string, string> = {
        "auth/email-already-in-use": "E-posten er allerede i bruk.",
        "auth/invalid-email": "Ugyldig e-postadresse.",
        "auth/weak-password": "Passordet er for svakt (minst 6 tegn).",
        "auth/operation-not-allowed":
          "Denne innloggingsmetoden er ikke aktivert.",
        "auth/too-many-requests": "For mange forsøk. Vent litt og prøv igjen.",
        "auth/network-request-failed":
          "Nettverksfeil. Sjekk tilkoblingen og prøv igjen.",
        "auth/missing-password": "Du må skrive inn passord.",
      };

      if (M[code]) return M[code];
      return `Noe gikk galt (${code}). Prøv igjen.`;
    }
    return "Noe gikk galt. Prøv igjen.";
  }

  /* Handle input fields */
  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handlePwChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  /* Handle sign in */
  function signUp() {
    setError(""); // clear previous error

    createUserWithEmailAndPassword(auth, email.trim(), password)
      .then((userCredential) => {
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
      .then(() => {
        setError("");
        navigate("/"); // go home after successful signup
      })
      .catch((err) => {
        setError(getAuthErrorMessage(err));
      });
  }

  return (
    <Main img="Mafia">
      <div className="w-full max-w-[400px] sm:w-3/4 md:w-2/3 md:max-w-[500px] flex flex-col relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <small className="bg-neutral-900 px-4 py-2 w-fit rounded-t-xl border-t border-x border-neutral-500">
          v. <strong>Alpha</strong>
        </small>
        <div className="bg-neutral-900/80 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <H1>Registrer bruker</H1>
          <form action="" className="flex flex-col gap-2">
            <div className="flex flex-col">
              <label htmlFor="email">E-post</label>
              <input
                className="bg-transparent px-2 py-1 border-b border-neutral-500"
                id="email"
                type="text"
                onChange={handleEmailChange}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="pw">Passord</label>
              <input
                className="bg-transparent px-2 py-1 border-b border-neutral-500"
                id="pw"
                type="password"
                onChange={handlePwChange}
              />
            </div>
            {error && <span className="text-red-500">{error}</span>}
          </form>
          <Button onClick={signUp}>Registrer</Button>
          <p className="text-stone-400 text-sm sm:text-base mt-4 text-center">
            Har du allerede en bruker?{" "}
            <Link to="/logginn">
              <span className="text-white hover:underline">Logg inn her!</span>
            </Link>
          </p>
        </div>
      </div>
    </Main>
  );
};

export default Signup;
