import { useState } from "react";
import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";

const Jackpot = () => {
  const [reels, setReels] = useState([0, 0, 0]);
  const [result, setResult] = useState("");
  const [balance, setBalance] = useState(1000);
  const betAmount = 100;

  // Function to spin the reels
  const spinReels = () => {
    if (balance < betAmount) {
      setResult("Not enough money to spin!");
      return;
    }

    const newReels = [
      Math.floor(Math.random() * 9) + 1, // Random number between 1 and 3 for reel 1
      Math.floor(Math.random() * 9) + 1, // Random number between 1 and 3 for reel 2
      Math.floor(Math.random() * 9) + 1, // Random number between 1 and 3 for reel 3
    ];
    setReels(newReels);
    evaluateSpin(newReels);
  };

  // Function to evaluate the result of the spin
  const evaluateSpin = (reels: number[]) => {
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      setBalance(balance + betAmount * 5); // 5x payout for matching all 3
      setResult("Jackpot! You won 5x your bet!");
    } else if (
      reels[0] === reels[1] ||
      reels[1] === reels[2] ||
      reels[0] === reels[2]
    ) {
      setBalance(balance + betAmount * 2); // 2x payout for 2 matches
      setResult("You won 2x your bet!");
    } else {
      setBalance(balance - betAmount); // Deduct bet amount if no match
      setResult("Du tapte. Prøv igjen!");
    }
  };

  return (
    <Main>
      <H1>Jackpot</H1>
      <div className="flex flex-col gap-4">
        <p>Balance: ${balance}</p>
        <div className="flex gap-4">
          <div>
            <i className={`fa-solid fa-${reels[0]}`}></i>
          </div>
          <div>
            <i className={`fa-solid fa-${reels[1]}`}></i>
          </div>{" "}
          <div>
            <i className={`fa-solid fa-${reels[2]}`}></i>
          </div>
        </div>

        <Button onClick={spinReels}>Spinn!</Button>
        <p>{result}</p>
      </div>
    </Main>
  );
};

export default Jackpot;
