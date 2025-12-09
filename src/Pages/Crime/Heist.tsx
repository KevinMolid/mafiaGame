// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H4 from "../../components/Typography/H4";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Box from "../../components/Box";

// functions
import { compactMmSs } from "../../Functions/TimeFunctions";

// React
import { useState, useEffect, ReactNode } from "react";

// Firebase
import { useNavigate } from "react-router-dom";

// Context
import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";
import { useCooldown } from "../../CooldownContext";

const Heist = () => {
  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const { cooldowns } = useCooldown();

  const [message, setMessage] = useState<ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");
  const [helpActive, setHelpActive] = useState<boolean>(false);

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, [userData, navigate]);

  // Function for comitting a crime
  const handleClick = async () => {
    setMessageType("success");
    setMessage("Du trykket på knappen!");
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <div className="flex items-baseline justify-between gap-4">
        <H1>Brekk</H1>
        {helpActive ? (
          <Button
            size="small-square"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small-square"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>

      <p className="pb-2">
        Her kan du gjøre et brekk sammen med andre spillere. Et vellykket brekk
        vil kunne gi mye penger og erfaring.
      </p>

      {/* Info box */}
      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm flex gap-x-8 flex-wrap">
            <article>
              <H4>Hvordan utføre et brekk</H4>
              <p>
                For å gjennomføre et brekk er du avhengig av å samarbeide med
                flere spillere.
              </p>
            </article>
          </Box>
        </div>
      )}

      {cooldowns["heist"] > 0 && (
        <p className="mb-4 text-stone-400">
          Du må vente{" "}
          <span className="font-bold text-neutral-200">
            {compactMmSs(cooldowns["heist"])}
          </span>{" "}
          før du kan gjøre et nytt brekk.
        </p>
      )}

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      <ul>
        <li>
          <p>Lite brekk</p>
        </li>
        <li>
          <p>Mellomstort brekk</p>
        </li>
        <li>
          <p>Stort brekk</p>
        </li>
      </ul>

      <Button onClick={handleClick}>Utfør brekk</Button>
    </Main>
  );
};

export default Heist;
