import { useState } from "react";
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";
import Box from "../../components/Box";
import JailBox from "../../components/JailBox";

import { getFirestore, doc, updateDoc } from "firebase/firestore";

import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useCharacter } from "../../CharacterContext";

const Jackpot = () => {
  const { userCharacter } = useCharacter();
  const [reels, setReels] = useState<Array<number>>([0, 0, 0]);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");
  const [betAmount, setBetAmount] = useState<number>(0);

  if (!userCharacter) return;

  // Function to spin the reels
  const spinReels = () => {
    if (betAmount < 100) {
      setMessageType("warning");
      setMessage("Du må satse minst $100!");
      return;
    }

    if (userCharacter?.stats.money < betAmount) {
      setMessageType("warning");
      setMessage("Du har ikke så mye penger!");
      return;
    }

    const newReels = [
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
    ];
    setReels(newReels);
    evaluateSpin(newReels);
  };

  // Function to evaluate the result of the spin
  const evaluateSpin = async (reels: number[]) => {
    let newMoney = userCharacter.stats.money;

    if (reels[0] === reels[1] && reels[1] === reels[2] && reels[2] === 7) {
      newMoney += betAmount * 150; // 150x payout for 7 7 7
      setMessageType("success");
      setMessage(`Jackpot! Du vant $${(betAmount * 150).toLocaleString()}!`);
    } else if (reels[0] === reels[1] && reels[1] === reels[2]) {
      newMoney += betAmount * 15; // 10x payout for matching all 3
      setMessageType("success");
      setMessage(
        `Du fikk 3 like og vant $${(betAmount * 15).toLocaleString()}!`
      );
    } else if (
      reels[0] === reels[1] ||
      reels[1] === reels[2] ||
      reels[0] === reels[2]
    ) {
      newMoney += betAmount; // 1x payout for 2 matches
      setMessageType("success");
      setMessage(`Du fikk 2 like og vant $${betAmount.toLocaleString()}!`);
    } else {
      newMoney -= betAmount; // Deduct bet amount if no match
      setMessageType("failure");
      setMessage(`Du tapte $${betAmount.toLocaleString()}. Prøv igjen!`);
    }

    try {
      const characterRef = doc(db, "Characters", userCharacter.id);
      // Update values in Firestore
      await updateDoc(characterRef, {
        "stats.money": newMoney,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (userCharacter?.inJail) {
    return <JailBox message={message} messageType={messageType} />;
  }

  return (
    <Main>
      <H1>Jackpot</H1>
      <div className="mb-4">
        <Box>
          <p>
            <small>
              <strong>Tre like 7'ere (Jackpot!)</strong> gir 150 ganger
              innsatsen
            </small>
          </p>
          <p>
            <small>
              <strong>Tre like av et annet tall</strong> gir 15 ganger innsatsen
            </small>
          </p>
          <p>
            <small>
              <strong>To like</strong> gir 1 gang innsatsen
            </small>
          </p>
        </Box>
      </div>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex flex-col gap-4">
        <div>
          <H2>Hvor mye vil du satse?</H2>
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-lg font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="number"
            placeholder="Skriv inn beløp"
            onChange={(e) => setBetAmount(Number(e.target.value))}
          />
        </div>

        <div className="w-[max-content]">
          <div className="flex gap-1 bg-neutral-950 border border-neutral-500 w-[max-content] px-8 py-4">
            <div className="w-12 py-4 flex justify-center items-center bg-neutral-200 border border-neutral-700">
              <i
                className={
                  `text-5xl fa-solid fa-${reels[0]} ` +
                  (reels[0] === 7 ? "text-red-600" : "text-neutral-700")
                }
              ></i>
            </div>
            <div className="w-12 py-4 flex justify-center items-center bg-neutral-200 border border-neutral-700">
              <i
                className={
                  `text-5xl fa-solid fa-${reels[1]} ` +
                  (reels[1] === 7 ? "text-red-600" : "text-neutral-700")
                }
              ></i>
            </div>{" "}
            <div className="w-12 py-4 flex justify-center items-center bg-neutral-200 border border-neutral-700">
              <i
                className={
                  `text-5xl fa-solid fa-${reels[2]} ` +
                  (reels[2] === 7 ? "text-red-600" : "text-neutral-700")
                }
              ></i>
            </div>
          </div>
          <div className="bg-neutral-950 border border-neutral-500 flex justify-center p-2">
            <Button onClick={spinReels}>Spill!</Button>
          </div>
        </div>
      </div>
    </Main>
  );
};

export default Jackpot;
