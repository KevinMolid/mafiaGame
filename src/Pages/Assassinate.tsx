import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";
import { useState } from "react";

const Assassinate = () => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "failure">(
    "failure"
  );

  const killPlayer = () => {
    setMessage("Player killed");
    setMessageType("success");
  };

  return (
    <section>
      <H1>Assassinate player</H1>
      {message && <InfoBox type={messageType}>{message}</InfoBox>}
      <H2>Who would you like to assassinate?</H2>
      <div className="flex flex-col gap-2 ">
        <input
          type="text"
          placeholder="Player name"
          className="bg-neutral-700 px-4 py-2 text-white"
        />
        <Button onClick={killPlayer}>Kill player</Button>
      </div>
    </section>
  );
};

export default Assassinate;
