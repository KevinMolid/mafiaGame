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
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  //FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const Login = () => {
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

  /* Handle Login*/
  function logIn() {
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
      setError(error.code);
    });
  }

  /* Login with Facebook */
  {
    /* function logInWithFacebook() {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        setError(error.code);
      });
  }*/
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
    <Main img="Mafia">
      <div className="w-full sm:w-5/6 md:w-2/3 max-w-[500px] flex flex-col relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <small className="bg-neutral-900 px-4 py-2 w-fit rounded-t-xl border-t border-x border-neutral-500">
          v. <strong>Alpha</strong>
        </small>
        <div className="bg-neutral-900/80 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <H1>Logg inn med</H1>

            {/* Google login */}
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
          <Button onClick={logIn}>Logg inn</Button>
          <p className="text-stone-400 text-sm sm:text-base">
            Har du ikke bruker?{" "}
            <Link to="/registrer">
              <span className="text-white hover:underline">
                Registrer deg her!
              </span>
            </Link>
          </p>
        </div>
      </div>
    </Main>
  );
};

export default Login;
