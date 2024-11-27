// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Firebaase
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const auth = getAuth();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "failure"
  >("info");
  const [email, setEmail] = useState("");

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

  /* Function to reset password */
  const forgotPassword = (email: string) => {
    if (!email) {
      setMessageType("warning");
      setMessage("Du må skrive inn en e-postadresse.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error.message);
      });
  };

  return (
    <Main img="Mafia">
      <div className="w-full max-w-[400px] sm:w-3/4 md:w-2/3 md:max-w-[500px] flex flex-col relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <small className="bg-neutral-900 px-4 py-2 w-fit rounded-t-xl border-t border-x border-neutral-500">
          v. <strong>Alpha</strong>
        </small>
        <div className="bg-neutral-900/80 border border-neutral-500 p-6 rounded-lg flex flex-col gap-4 w-full">
          <H1>Glemt passord</H1>

          {message && <InfoBox type={messageType}>{message}</InfoBox>}

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
          </form>
          <Button onClick={() => forgotPassword(email)}>
            Tilbakestill passord
          </Button>
          <p className="text-stone-400 text-sm sm:text-base text-center mt-4">
            Gå tilbake til{" "}
            <Link to="/logginn">
              <span className="text-white hover:underline">Logg inn!</span>
            </Link>
          </p>
        </div>
      </div>
    </Main>
  );
};

export default ForgotPassword;
