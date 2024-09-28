import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import CrimeBox from "../../components/CrimeBox";
import InfoBox from "../../components/InfoBox";

import { useState } from "react";

const StreetCrime = () => {
  const [message, setMessage] = useState("You did this and earned $34");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "important" | "warning" | "info"
  >("success");

  function handleClick() {
    setMessage("Something was clicked!");
    setMessageType("warning");
  }

  return (
    <section>
      <H1>Street Crimes</H1>
      <InfoBox type={messageType}>{message}</InfoBox>
      <p className="mb-4 text-stone-400 font-medium">Select Crime:</p>
      <div className="grid grid-cols-[min-content_auto] gap-2 mb-4">
        <CrimeBox img="src\assets\PickpocketBw.png" heading="Pickpocket">
          Steal from a stranger
        </CrimeBox>
        <CrimeBox img="src\assets\VandalismBw.png" heading="Vandalism">
          Ruin something for money
        </CrimeBox>
        <CrimeBox
          img="src\assets\ProtectionRacketBw.png"
          heading="Protection Racket"
        >
          Offer protection to a venue
        </CrimeBox>
        <CrimeBox img="src\assets\StreetRacingBw.png" heading="Street Racing">
          Compete in local a street race
        </CrimeBox>
      </div>
      <Button onClick={handleClick}>Commit Crime</Button>
    </section>
  );
};

export default StreetCrime;
