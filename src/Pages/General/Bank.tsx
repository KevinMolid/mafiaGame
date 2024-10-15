// Components
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import Button from "../../components/Button";
import InfoBox from "../../components/InfoBox";

// React
import { useState } from "react";

// Context
import { useCharacter } from "../../CharacterContext";

// Firebase
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Bank = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "info"
  >("info");

  const { character, setCharacter } = useCharacter();

  if (!character) {
    return null;
  }

  const handleInputChange = (e: any) => {
    setAmount(parseFloat(e.target.value));
  };

  const deposit = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Please enter amount.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = character.stats.bank
          ? character.stats.bank + amount
          : amount;
        const newMoney = character.stats.money - amount;

        // Check if there is enough money to deposit
        if (newMoney < 0) {
          setMessageType("warning");
          setMessage("You don't have enough money to deposit.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.bank": newBank,
          "stats.money": newMoney,
        });

        setMessageType("success");
        setMessage(
          `You deposited $${amount.toLocaleString()} to your bank account.`
        );

        setCharacter((prevCharacter: any) => ({
          ...prevCharacter,
          stats: {
            ...prevCharacter.stats,
            bank: newBank,
            money: newMoney,
          },
        }));
      }
    } catch (error) {
      console.error("Error depositing funds:", error);
    }
  };

  const withdraw = async () => {
    try {
      const characterRef = doc(db, "Characters", character.id);

      if (amount === "") {
        setMessageType("warning");
        setMessage("Please enter amount.");
        return;
      }

      // Calculate new values
      if (amount) {
        const newBank = character.stats.bank
          ? character.stats.bank - amount
          : -amount;
        const newMoney = character.stats.money + amount;

        // Check if there is enough money to deposit
        if (newBank < 0) {
          setMessageType("warning");
          setMessage("You don't have enough money to withdraw.");
          return;
        }

        // Update values in Firestore
        await updateDoc(characterRef, {
          "stats.bank": newBank,
          "stats.money": newMoney,
        });

        setMessageType("success");
        setMessage(
          `You withdrew $${amount.toLocaleString()} from your bank account.`
        );

        setCharacter((prevCharacter: any) => ({
          ...prevCharacter,
          stats: {
            ...prevCharacter.stats,
            bank: newBank,
            money: newMoney,
          },
        }));
      }
    } catch (error) {
      console.error("Error widthdrawing funds:", error);
    }
  };

  return (
    <section>
      <H1>Bank</H1>
      <p className="mb-2">
        Here you can deposit and withdraw money from your bank account. Money in
        the bank will not get lost if another player robs you.
      </p>
      <p className="mb-4">
        At midnight you will receive 5% interest on the money in your bank
        account.
      </p>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <H2>Bank account</H2>
      <p className="mb-4">
        Balance:{" "}
        <span className="font-bold text-neutral-200">
          ${character?.stats.bank?.toLocaleString() || 0}
        </span>
      </p>
      <form className="flex flex-col gap-2" action="">
        <input
          className="bg-neutral-700 py-2 px-4 text-white placeholder-neutral-400"
          type="number"
          value={amount}
          placeholder="Enter amount"
          onChange={handleInputChange}
        />
        <div className="flex gap-2">
          {" "}
          <Button onClick={withdraw}>Withdraw</Button>
          <Button onClick={deposit}>Deposit</Button>
        </div>
      </form>
    </section>
  );
};

export default Bank;
