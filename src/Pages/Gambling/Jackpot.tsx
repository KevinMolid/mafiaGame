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

// helper – strips spaces, NBSP, commas, dots, etc.
const sanitizeInt = (s: string) => s.replace(/[^\d]/g, "");

const Jackpot = () => {
  const { userCharacter } = useCharacter();
  const [reels, setReels] = useState<Array<number>>([0, 0, 0]);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info" | "warning"
  >("info");
  const [betAmount, setBetAmount] = useState<number | "">("");

  if (!userCharacter) return null;

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInt(e.target.value);
    if (cleaned === "") setBetAmount("");
    else setBetAmount(parseInt(cleaned, 10));
  };

  // Function to spin the reels
  const spinReels = () => {
    const bet = typeof betAmount === "number" ? betAmount : 0;

    if (bet < 100) {
      setMessageType("warning");
      setMessage("Du må satse minst $100!");
      return;
    }

    if (userCharacter?.stats.money < bet) {
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
    evaluateSpin(newReels, bet);
  };

  // Function to evaluate the result of the spin
  const evaluateSpin = async (reels: number[], bet: number) => {
    let newMoney = userCharacter.stats.money;

    if (reels[0] === reels[1] && reels[1] === reels[2] && reels[2] === 7) {
      newMoney += bet * 149;
      setMessageType("success");
      setMessage(
        <p>
          <strong>Jackpot!</strong> Du vant{" "}
          <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{(bet * 150).toLocaleString("nb-NO")}</strong>!
        </p>
      );
    } else if (reels[0] === reels[1] && reels[1] === reels[2]) {
      newMoney += bet * 14;
      setMessageType("success");
      setMessage(
        <p>
          Du fikk 3 like og vant <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{(bet * 15).toLocaleString("nb-NO")}</strong>!
        </p>
      );
    } else if (
      reels[0] === reels[1] ||
      reels[1] === reels[2] ||
      reels[0] === reels[2]
    ) {
      newMoney += bet; // net +1× (2× return)
      setMessageType("success");
      setMessage(
        <p>
          Du fikk 2 like og vant <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{(bet * 2).toLocaleString("nb-NO")}</strong>!
        </p>
      );
    } else {
      newMoney -= bet;
      setMessageType("failure");
      setMessage(
        <p>
          Du tapte <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{bet.toLocaleString("nb-NO")}</strong>. Prøv igjen!
        </p>
      );
    }

    try {
      await updateDoc(doc(db, "Characters", userCharacter.id), {
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
              <strong>777 (Jackpot!):</strong> 150 × innsats
            </small>
          </p>
          <p>
            <small>
              <strong>Tre like:</strong> 15 × innsats
            </small>
          </p>
          <p>
            <small>
              <strong>To like:</strong> 2 × innsats
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
            type="text"
            placeholder="Skriv inn beløp"
            value={
              betAmount === "" ? "" : Number(betAmount).toLocaleString("nb-NO")
            }
            onChange={handleBetChange}
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
