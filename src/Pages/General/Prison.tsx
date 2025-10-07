// Components
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Box from "../../components/Box";
import CharacterList from "../../components/CharacterList";
import Button from "../../components/Button";

import { useState } from "react";

import { useCharacter } from "../../CharacterContext";

// Use the existing arrest function (same as GTA.tsx)
import { arrest } from "../../Functions/RewardFunctions";

const Prison = () => {
  const { userCharacter } = useCharacter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");
  const [busy, setBusy] = useState(false);

  async function handleSelfJail() {
    if (!userCharacter) {
      setMessageType("warning");
      setMessage("Fant ikke spillkarakteren din.");
      return;
    }
    try {
      setBusy(true);
      // Let the shared function do all the Firestore updates (city, release time, flags, etc.)
      await arrest(userCharacter);
      setMessageType("failure");
      setMessage(`Du ble arrestert og satt i fengsel.`);
    } catch (e) {
      console.error(e);
      setMessageType("failure");
      setMessage("Klarte ikke å sette deg i fengsel. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main img="PrisonBg">
      <H1>Fengsel</H1>
      <p className="mb-4">
        Her havner du dersom du blir tatt for kriminelle handlinger i{" "}
        {userCharacter?.location}.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <p className="mb-4">Du er for øyeblikket ikke i fengsel.</p>

      <div className="mb-4">
        <Button onClick={handleSelfJail} disabled={busy}>
          {busy ? (
            <i className="fa-solid fa-spinner fa-spin" />
          ) : (
            <i className="fa-solid fa-handcuffs" />
          )}{" "}
          Sett meg i fengsel
        </Button>
      </div>

      <Box>
        <H2>Spillere i fengsel</H2>
        <CharacterList type="jail" />
      </Box>
    </Main>
  );
};

export default Prison;
