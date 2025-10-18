// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

// React
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Auth
import { useAuth } from "../AuthContext";

// Firebase
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const emailRegex =
  // simple but practical email check
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ForgotPassword = () => {
  const auth = getAuth();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "info" | "success" | "warning" | "failure"
  >("info");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVersionInfoActive, setIsVersionInfoActive] =
    useState<boolean>(false);

  useEffect(() => {
    if (userData) {
      navigate("/");
    }
  }, [userData, navigate]);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    // Clear transient messages while typing
    if (message) {
      setMessage("");
    }
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setMessageType("warning");
      setMessage("Du må skrive inn en e-postadresse.");
      return;
    }

    if (!emailRegex.test(trimmed)) {
      setMessageType("warning");
      setMessage("Dette ser ikke ut som en gyldig e-postadresse.");
      return;
    }

    try {
      setIsSending(true);
      setMessage("");
      // Optional: add ActionCodeSettings if you want a custom continue URL
      await sendPasswordResetEmail(auth, trimmed);
      setMessageType("success");
      setMessage(
        "Hvis det finnes en konto med denne e-posten, har vi sendt en e-post med instruksjoner for å tilbakestille passordet. Sjekk også søppelpost."
      );
    } catch (err: any) {
      // Map common Firebase Auth error codes to friendly text (Norwegian)
      const code: string | undefined = err?.code;
      let friendly = "Noe gikk galt. Prøv igjen senere.";
      let type: typeof messageType = "failure";

      switch (code) {
        case "auth/invalid-email":
          type = "warning";
          friendly = "Ugyldig e-postadresse. Sjekk stavemåten.";
          break;
        case "auth/user-not-found":
          // For personvern er det vanlig å ikke avsløre om bruker finnes.
          // Men om du ønsker spesifikk beskjed, bytt til en warning med “fant ingen bruker”.
          type = "success";
          friendly =
            "Hvis det finnes en konto med denne e-posten, har vi sendt en e-post med instruksjoner for å tilbakestille passordet.";
          break;
        case "auth/too-many-requests":
          friendly = "For mange forsøk på kort tid. Vent litt og prøv igjen.";
          break;
        case "auth/network-request-failed":
          friendly = "Nettverksfeil. Sjekk tilkoblingen og prøv igjen.";
          break;
        default:
          // Keep generic failure text
          break;
      }

      setMessageType(type);
      setMessage(friendly);
      // Optionally log the real error for debugging
      // console.error(err);
    } finally {
      setIsSending(false);
    }
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
              <H1>Glemt passord</H1>
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

          {message && (
            <InfoBox type={messageType} onClose={() => setMessage("")}>
              {message}
            </InfoBox>
          )}

          <form className="flex flex-col gap-2" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col">
              <label htmlFor="email">E-post</label>
              <input
                className="bg-transparent py-1 border-b border-neutral-500 text-neutral-200 text-xl outline-0 focus:border-white"
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                disabled={isSending}
                spellCheck={false}
              />
            </div>

            <Button type="submit" onClick={onSubmit} disabled={isSending}>
              {isSending ? "Sender ..." : "Tilbakestill passord"}
            </Button>
          </form>
        </div>
        <p className="text-stone-400 text-sm sm:text-base text-center mt-4">
          Gå tilbake til{" "}
          <Link to="/logginn">
            <span className="text-white hover:underline">Logg inn!</span>
          </Link>
        </p>
      </div>
    </Main>
  );
};

export default ForgotPassword;
