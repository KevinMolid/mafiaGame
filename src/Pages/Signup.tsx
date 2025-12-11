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
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Firebaase
import {
  GoogleAuthProvider,
  //FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { FirebaseError } from "firebase/app";

import { db } from "../firebase";

const Signup = () => {
  const auth = getAuth();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [isVersionInfoActive, setIsVersionInfoActive] =
    useState<boolean>(false);

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

  /* Login with Google */
  function logInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        setError(error.code);
      });
  }

  return (
    <Main noBg>
      <div className="w-full max-w-[400px] sm:w-3/4 md:w-2/3 md:max-w-[500px] flex flex-col relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <small className="flex justify-center items-center gap-2 bg-neutral-900 pl-4 pr-2 py-1 w-fit rounded-t-xl border-t border-x border-neutral-500">
          <p>
            v. <strong>Alfa</strong>{" "}
          </p>

          <Button
            style={isVersionInfoActive ? "helpActive" : "help"}
            size="small-square"
            onClick={() => setIsVersionInfoActive(!isVersionInfoActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        </small>

        <div className="bg-neutral-900 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <div className="flex gap-8">
            <div className="text-nowrap">
              <H1>Ny bruker</H1>
            </div>

            {isVersionInfoActive && (
              <aside className="border-2 h-min bg-neutral-950 border-yellow-400 rounded-lg px-2 py-1 text-sm">
                <p className="mb-1 text-neutral-200">
                  Spillet er i en tidlig fase og delt med kun en liten gruppe
                  for testing.
                </p>
              </aside>
            )}
          </div>

          <form action="" className="flex flex-col gap-2">
            <div className="flex flex-col">
              <label htmlFor="email">E-post</label>
              <input
                autoFocus
                className="bg-transparent py-1 border-b border-neutral-500 text-neutral-200 text-xl outline-0 focus:border-white selection:border-white"
                id="email"
                type="text"
                onChange={handleEmailChange}
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col">
              <div className="relative">
                <label htmlFor="pw">Passord</label>
                <input
                  className="w-full bg-transparent py-1 border-b border-neutral-500 text-neutral-200 text-xl outline-0 focus:border-white selection:border-white"
                  id="pw"
                  type={showPassword ? "text" : "password"}
                  onChange={handlePwChange}
                  spellCheck={false}
                />
                <div className="absolute right-0 bottom-0">
                  <Button
                    size="square"
                    style="text"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="text-xl fa-solid fa-eye"></i>
                    ) : (
                      <i className="text-xl fa-solid fa-eye-slash"></i>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {error && <span className="text-red-500">{error}</span>}
          </form>
          <Button onClick={signUp}>Opprett bruker</Button>

          {/* Google login */}
          <div className="grid grid-cols-[auto_max-content_auto] gap-2 items-center">
            <hr className="border-neutral-600" />
            <p className="text-sm sm:text-base text-center text-nowrap">
              Eller registrer deg med
            </p>
            <hr className="border-neutral-600" />
          </div>
          <Button style="secondary" onClick={logInWithGoogle}>
            <div className="flex justify-center gap-2">
              <img
                src="https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png"
                alt="Google logo"
                className="size-6"
              />
              <p className="mr-4">Google</p>
            </div>
          </Button>
        </div>
        <p className="text-stone-400 text-sm sm:text-base mt-4 text-center">
          Har du allerede en bruker?{" "}
          <Link to="/logginn">
            <span className="text-white hover:underline">Logg inn her!</span>
          </Link>
        </p>
      </div>
    </Main>
  );
};

export default Signup;
