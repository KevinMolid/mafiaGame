// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Button from "../../components/Button";

import { useState } from "react";

import { useCharacter } from "../../CharacterContext";
import { useAuth } from "../../AuthContext";

const Prison = () => {
  const { userData } = useAuth();
  const { character } = useCharacter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");

  const handleButtonClick = () => {
    setMessageType("info");
    setMessage(
      "Denne funksjonen er enda ikke utviklet, men kommer etter hvert."
    );
  };

  if (character?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main img="PrisonBg">
      <H1>Fengsel</H1>
      <p className="mb-4">
        Her havner du dersom du blir tatt for kriminelle handlinger i{" "}
        {character?.location}.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <p className="mb-4">Du er for øyeblikket ikke i fengsel.</p>

      {userData?.type === "admin" && (
        <Button onClick={handleButtonClick}>Besøk fengsel</Button>
      )}
    </Main>
  );
};

export default Prison;
